<?php

namespace App\Http\Controllers\Api\V1\Expert;

use App\Enums\CvOrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CvOrderResource;
use App\Models\CvOrder;
use App\Services\CvOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * مساحة عمل الخبير: طلباته المسنَدة له وحدها، وما يلزمه لإنجازها — تحميل
 * ملف الطالب، تسليم النسخة النهائية، وتحريك مراحل العمل.
 *
 * لا شيء من صلاحيات الإدارة هنا عمداً: تأكيد إشعار التحويل مسألة مالية
 * تبقى للإدارة وحدها، وكذلك حذف الطلبات والتسعير وإدارة المستخدمين.
 */
class OrderController extends Controller
{
    public function __construct(private readonly CvOrderService $orders) {}

    public function index(Request $request): JsonResponse
    {
        $expertId = $request->user()->id;

        $orders = CvOrder::with(['user:id,name,email'])
            ->where('expert_id', $expertId)
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
                'payment_status' => $order->payment_status->value,
                'payment_status_label' => $order->payment_status->label(),
                // الطلب متوقّف عند الدفع؛ الخبير يراه بانتظار الإدارة لا يعمل عليه
                'payment_blocks_work' => $order->payment_status->blocksWork(),
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'next_status' => $order->status->next()?->value,
                'next_status_label' => $order->status->next()?->label(),
                'next_status_short' => $order->status->next()?->shortLabel(),
                'ats_score' => $order->ats_score,
                'student_name' => $order->user->name,
                'student_email' => $order->user->email,
                'updated_at' => $order->updated_at,
            ])->all(),
            'meta' => [
                'total' => (clone $this->mine($expertId))->count(),
                'in_progress' => (clone $this->mine($expertId))->active()->count(),
                'awaiting_payment' => (clone $this->mine($expertId))
                    ->where('payment_status', PaymentStatus::AwaitingReview)->count(),
                'delivered' => (clone $this->mine($expertId))
                    ->where('status', CvOrderStatus::Delivered)->count(),
            ],
        ]);
    }

    public function show(Request $request, CvOrder $cvOrder): CvOrderResource
    {
        $this->authorizeAssigned($request, $cvOrder);

        return new CvOrderResource(
            $cvOrder->load(['timeline', 'atsChecks', 'notes.author', 'user:id,name,email']),
        );
    }

    /** تحميل الملف الذي رفعه الطالب ليعمل عليه الخبير */
    public function downloadSource(Request $request, CvOrder $cvOrder): StreamedResponse
    {
        $this->authorizeAssigned($request, $cvOrder);
        abort_unless($cvOrder->source_file_path, 404, 'لم يرفق الطالب ملفاً مع هذا الطلب.');
        $this->guardFileExists($cvOrder->source_file_path);

        return Storage::disk('local')->download(
            $cvOrder->source_file_path,
            $cvOrder->source_file_name ?? "طلب-{$cvOrder->order_number}",
        );
    }

    /** تسليم الملف النهائي بعد إعداده يدوياً */
    public function deliver(Request $request, CvOrder $cvOrder): JsonResponse
    {
        $this->authorizeAssigned($request, $cvOrder);

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

        return response()->json([
            'message' => 'تم تسليم الملف وإشعار الطالب.',
            'data' => (new CvOrderResource($order))->resolve(),
        ]);
    }

    /**
     * تحريك الطلب إلى المرحلة التالية — للمرحلة التالية فقط.
     *
     * الإدارة تنقل الطلب إلى أي حالة تريدها من لوحتها؛ الخبير يمشي
     * بالترتيب: لا يقفز مراحل ولا يعيد الطلب إلى انتظار التحويل، فتلك
     * قراراتٌ إدارية لا عمل يومي.
     */
    public function advance(Request $request, CvOrder $cvOrder): JsonResponse
    {
        $this->authorizeAssigned($request, $cvOrder);

        $validated = $request->validate([
            'status' => ['required', Rule::enum(CvOrderStatus::class)],
        ]);

        $status = CvOrderStatus::from($validated['status']);

        abort_unless($cvOrder->status->next() === $status, 422, 'هذه ليست المرحلة التالية لهذا الطلب.');

        try {
            $order = $this->orders->advance($cvOrder, $status);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => "تم تحديث الطلب إلى: {$status->label()}",
            'data' => (new CvOrderResource($order))->resolve(),
        ]);
    }

    private function mine(int $expertId)
    {
        return CvOrder::where('expert_id', $expertId)->where('status', '!=', CvOrderStatus::Draft);
    }

    private function authorizeAssigned(Request $request, CvOrder $cvOrder): void
    {
        abort_unless($cvOrder->expert_id === $request->user()->id, 403, 'هذا الطلب غير مسنَد إليك.');
    }

    /**
     * مسارٌ مسجَّل في قاعدة البيانات لا يعني ملفاً على القرص: تخزين الحاوية
     * مؤقّت، فإعادة النشر بلا قرص مثبّت تمحو المرفوعات ويبقى سجلّها.
     */
    private function guardFileExists(string $path): void
    {
        abort_unless(
            Storage::disk('local')->exists($path),
            404,
            'الملف لم يعد موجوداً على الخادم. اطلب من الطالب رفعه مرة أخرى.',
        );
    }
}
