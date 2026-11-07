<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CvOrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CvOrderResource;
use App\Models\CvOrder;
use App\Services\AuditService;
use App\Services\CvOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function __construct(
        private readonly CvOrderService $orders,
        private readonly AuditService $audit,
    ) {}

    public function index(Request $request): JsonResponse
    {
        // اللوحة تعرض القائمة العاملة، والمحذوفة تُطلب صراحةً للمراجعة
        $deleted = $request->boolean('deleted');

        $orders = CvOrder::with(['user:id,name,email', 'expert:id,name', 'deletedBy:id,name'])
            ->when($deleted, fn ($query) => $query->onlyTrashed())
            ->where('status', '!=', CvOrderStatus::Draft)
            ->latest()
            ->limit(40)
            ->get();

        return response()->json([
            'data' => $orders->map(fn (CvOrder $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'kind' => $order->kind->value,
                'kind_label' => $order->kind->label(),
                'has_source_file' => filled($order->source_file_path),
                'source_file_name' => $order->source_file_name,
                'has_final_file' => filled($order->final_file_path),
                'final_file_name' => $order->final_file_name,
                'request_note' => $order->request_note,
                'price_amount' => (float) $order->price_amount,
                'price_currency' => $order->price_currency,
                'payment_status' => $order->payment_status->value,
                'payment_status_label' => $order->payment_status->label(),
                'has_receipt' => filled($order->receipt_file_path),
                'receipt_file_name' => $order->receipt_file_name,
                'payment_note' => $order->payment_note,
                'payment_rejection_reason' => $order->payment_rejection_reason,
                'awaiting_payment_review' => $order->payment_status === PaymentStatus::AwaitingReview,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'next_status' => $order->status->next()?->value,
                'next_status_label' => $order->status->next()?->label(),
                'next_status_short' => $order->status->next()?->shortLabel(),
                'ats_score' => $order->ats_score,
                'student_name' => $order->user->name,
                'student_email' => $order->user->email,
                'expert_name' => $order->expert?->name,
                'deleted_at' => $order->deleted_at,
                'deletion_reason' => $order->deletion_reason,
                'deleted_by_name' => $order->deletedBy?->name,
                'updated_at' => $order->updated_at,
            ])->all(),
            'meta' => [
                'total' => CvOrder::where('status', '!=', CvOrderStatus::Draft)->count(),
                'awaiting_payment' => CvOrder::where('payment_status', PaymentStatus::AwaitingReview)->count(),
                'in_progress' => CvOrder::active()->count(),
                'delivered' => CvOrder::where('status', CvOrderStatus::Delivered)->count(),
                'unassigned' => CvOrder::whereNull('expert_id')
                    ->where('status', '!=', CvOrderStatus::Draft)
                    ->count(),
                'deleted' => CvOrder::onlyTrashed()->count(),
                'showing_deleted' => $deleted,
            ],
        ]);
    }

    /** تحميل الملف الذي رفعه الطالب ليعمل عليه الفريق */
    public function downloadSource(CvOrder $cvOrder): StreamedResponse
    {
        abort_unless($cvOrder->source_file_path, 404, 'لم يرفق الطالب ملفاً مع هذا الطلب.');
        $this->guardFileExists($cvOrder->source_file_path);

        return Storage::disk('local')->download(
            $cvOrder->source_file_path,
            $cvOrder->source_file_name ?? "طلب-{$cvOrder->order_number}",
        );
    }

    /** تحميل إشعار التحويل الذي أرفقه الطالب للتأكّد منه */
    public function downloadReceipt(CvOrder $cvOrder): StreamedResponse
    {
        abort_unless($cvOrder->receipt_file_path, 404, 'لم يرفق الطالب إشعار تحويل لهذا الطلب.');
        $this->guardFileExists($cvOrder->receipt_file_path);

        return Storage::disk('local')->download(
            $cvOrder->receipt_file_path,
            $cvOrder->receipt_file_name ?? "إشعار-{$cvOrder->order_number}",
        );
    }

    /**
     * قبول التحويل أو رفضه بعد الاطّلاع على الإشعار.
     * القبول وحده هو ما يبدأ العمل على الطلب المدفوع.
     */
    public function reviewPayment(Request $request, CvOrder $cvOrder): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:accept,reject'],
            'reason' => ['required_if:decision,reject', 'nullable', 'string', 'min:3', 'max:500'],
        ], [
            'reason.required_if' => 'اكتب سبب الرفض ليعرف الطالب ما عليه تصحيحه.',
        ]);

        abort_unless($cvOrder->isPaid(), 422, 'هذا الطلب مجاني ولا يحتاج تأكيد تحويل.');
        abort_unless($cvOrder->receipt_file_path, 422, 'لم يرفق الطالب إشعار تحويل بعد.');

        $accepted = $validated['decision'] === 'accept';

        $order = $accepted
            ? $this->orders->acceptPayment($cvOrder, $request->user())
            : $this->orders->rejectPayment($cvOrder, $request->user(), $validated['reason']);

        $this->audit->log($request->user(), 'cv_order.payment', 'CvOrder', $order->id, [
            'decision' => $validated['decision'],
        ]);

        return response()->json([
            'message' => $accepted
                ? 'تم تأكيد التحويل وبدأ العمل على الطلب.'
                : 'تم رفض الإشعار وإشعار الطالب.',
            'data' => (new CvOrderResource($order))->resolve(),
        ]);
    }

    /** تسليم الملف النهائي بعد إعداده يدوياً */
    public function deliver(Request $request, CvOrder $cvOrder): JsonResponse
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx',
                'max:'.(config('menhity.uploads.max_bytes') / 1024),
            ],
        ], [
            'file.required' => 'أرفق الملف النهائي لتسليمه.',
            'file.mimes' => 'الملف يجب أن يكون PDF أو Word.',
        ]);

        try {
            $order = $this->orders->deliver($cvOrder, $request->file('file'));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->audit->log($request->user(), 'cv_order.deliver', 'CvOrder', $order->id, [
            'file' => $order->final_file_name,
        ]);

        return response()->json([
            'message' => 'تم تسليم الملف وإشعار الطالب.',
            'data' => (new CvOrderResource($order))->resolve(),
        ]);
    }

    /**
     * حذف الطلب من اللوحة.
     *
     * متاحٌ في كل المراحل، وبعد تأكيد التحويل كذلك — لكنّ السبب مطلوب:
     * الطالب يقرؤه في إشعاره، وهو ما يبقى في السجلّ لمن يراجع لاحقاً
     * لماذا اختفى طلبٌ دُفع ثمنه.
     */
    public function destroy(Request $request, CvOrder $cvOrder): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ], [
            'reason.required' => 'اكتب سبب الحذف — يصل الطالب ويبقى في السجلّ.',
        ]);

        $this->orders->remove($cvOrder, $request->user(), $validated['reason']);

        $this->audit->log($request->user(), 'cv_order.delete', 'CvOrder', $cvOrder->id, [
            'reason' => $validated['reason'],
            'payment_status' => $cvOrder->payment_status->value,
            'price_amount' => (float) $cvOrder->price_amount,
        ]);

        return response()->json(['message' => 'تم حذف الطلب وإشعار الطالب.']);
    }

    /** التراجع عن الحذف */
    public function restore(Request $request, int $cvOrder): JsonResponse
    {
        $order = CvOrder::onlyTrashed()->findOrFail($cvOrder);

        $this->orders->restore($order, $request->user());

        $this->audit->log($request->user(), 'cv_order.restore', 'CvOrder', $order->id);

        return response()->json(['message' => 'تمت استعادة الطلب.']);
    }

    /**
     * مسارٌ مسجَّل في قاعدة البيانات لا يعني ملفاً على القرص: تخزين الحاوية
     * مؤقّت، فإعادة النشر بلا قرص مثبّت تمحو المرفوعات ويبقى سجلّها.
     * بلا هذا الفحص يرمي Flysystem استثناءً فيصل المستخدم خطأ خادم غامض.
     */
    private function guardFileExists(string $path): void
    {
        abort_unless(
            Storage::disk('local')->exists($path),
            404,
            'الملف لم يعد موجوداً على الخادم. اطلب من الطالب رفعه مرة أخرى.',
        );
    }

    /** تحريك الطلب إلى المرحلة التالية */
    public function advance(Request $request, CvOrder $cvOrder): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(CvOrderStatus::class)],
        ]);

        $status = CvOrderStatus::from($validated['status']);

        try {
            $order = $this->orders->advance($cvOrder, $status);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->audit->log($request->user(), 'cv_order.status', 'CvOrder', $order->id, [
            'status' => $status->value,
        ]);

        return response()->json([
            'message' => "تم تحديث الطلب إلى: {$status->label()}",
            'data' => (new CvOrderResource($order))->resolve(),
        ]);
    }
}
