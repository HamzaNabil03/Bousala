<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CvOrderKind;
use App\Http\Controllers\Controller;
use App\Http\Resources\CvOrderResource;
use App\Models\CvOrder;
use App\Services\CvOrderService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CvOrderController extends Controller
{
    private const RELATIONS = ['timeline', 'atsChecks', 'notes.author', 'expert.expertProfile'];

    public function __construct(
        private readonly CvOrderService $orders,
        private readonly ProfileController $profiles,
        private readonly SettingsService $settings,
    ) {}

    /**
     * أسعار الخدمات وبيانات الحساب الذي يحوّل إليه الطالب.
     * تُقرأ قبل إرسال الطلب ليعرف كم يحوّل وإلى أين.
     */
    public function paymentInfo(): JsonResponse
    {
        $currency = $this->settings->currency();

        $services = collect([CvOrderKind::CvBuild, CvOrderKind::LetterBuild])->map(fn (CvOrderKind $kind) => [
            'kind' => $kind->value,
            'label' => $kind->label(),
            'price' => $this->settings->priceFor($kind),
            'currency' => $currency,
        ])->all();

        return response()->json([
            'data' => [
                'currency' => $currency,
                'services' => $services,
                'account' => $this->settings->payment(),
                'configured' => $this->settings->hasPaymentDetails(),
            ],
        ]);
    }

    /**
     * طلب «كتابة سيرة من الصفر» النشط للمستخدم — تستخدمه شاشة الويزرد
     * لتحويله للمتابعة بدل بدء طلب جديد.
     *
     * مقصورٌ على هذا النوع تحديداً: الويزرد لا يُرسل غيره، فطلب تحسين
     * قائم لا يجوز أن يمنعه. ومحصورٌ بالنشط لا المُسلَّم: طلبٌ سُلِّم
     * انتهى أمره، ومنعُ طلب جديد بعده يُبقي شاشة الويزرد تصفه خطأً بأنه
     * «قيد المعالجة» بلا نهاية.
     */
    public function active(Request $request): JsonResponse
    {
        $order = $request->user()->cvOrders()
            ->where('kind', CvOrderKind::CvBuild)
            ->active()
            ->latest()
            ->first();

        return response()->json([
            'data' => $order ? (new CvOrderResource($order->load(self::RELATIONS)))->resolve() : null,
        ]);
    }

    /** جاهزية الملف لإرسال الطلب */
    public function readiness(Request $request): JsonResponse
    {
        $profile = $this->profiles->profileFor($request->user());

        return response()->json(['data' => $this->orders->readiness($profile)]);
    }

    public function show(Request $request, CvOrder $cvOrder): CvOrderResource
    {
        abort_unless(
            $cvOrder->user_id === $request->user()->id || $request->user()->isAdminLevel(),
            403,
        );

        return new CvOrderResource($cvOrder->load(self::RELATIONS));
    }

    /** إرسال طلب صياغة جديد */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $maxKilobytes = config('menhity.uploads.max_bytes') / 1024;

        $validated = $request->validate([
            'kind' => ['required', Rule::in(['cv_build', 'letter_build'])],
            'file' => ['nullable', 'file', 'mimes:pdf,doc,docx', "max:{$maxKilobytes}"],
            'note' => ['nullable', 'string', 'max:1000'],
            // الإشعار صورة غالباً (لقطة من تطبيق البنك) أو PDF
            'receipt' => ['nullable', 'file', 'mimes:pdf,png,jpg,jpeg', "max:{$maxKilobytes}"],
            'payment_note' => ['nullable', 'string', 'max:500'],
        ], [
            'file.mimes' => 'الملف يجب أن يكون PDF أو Word.',
            'receipt.mimes' => 'إشعار التحويل يجب أن يكون صورة أو PDF.',
        ]);

        $kind = CvOrderKind::from($validated['kind']);

        /*
         * المنع لكل خدمة على حدة: طلب تحسين خطاب قائم لا يمنع طلب سيرة،
         * فهما مساران مستقلان يعمل عليهما الفريق بالتوازي.
         */
        $existing = $user->cvOrders()->active()->where('kind', $kind)->latest()->first();

        if ($existing) {
            return response()->json([
                'message' => "لديك طلب «{$kind->label()}» قيد المعالجة بالفعل.",
                'data' => (new CvOrderResource($existing->load(self::RELATIONS)))->resolve(),
            ], 409);
        }

        try {
            $order = $this->orders->submit(
                $user,
                $this->profiles->profileFor($user),
                $kind,
                $request->file('file'),
                $validated['note'] ?? null,
                $request->file('receipt'),
                $validated['payment_note'] ?? null,
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'تم استلام طلبك بنجاح.',
            'data' => (new CvOrderResource($order->load(self::RELATIONS)))->resolve(),
        ], 201);
    }

    /** رفع إشعار تحويل بديل بعد رفض الأول */
    public function replaceReceipt(Request $request, CvOrder $cvOrder): JsonResponse
    {
        abort_unless($cvOrder->user_id === $request->user()->id, 403);
        abort_unless($cvOrder->isPaid(), 422, 'هذا الطلب مجاني ولا يحتاج إشعار تحويل.');

        $validated = $request->validate([
            'receipt' => [
                'required',
                'file',
                'mimes:pdf,png,jpg,jpeg',
                'max:'.(config('menhity.uploads.max_bytes') / 1024),
            ],
            'payment_note' => ['nullable', 'string', 'max:500'],
        ], [
            'receipt.required' => 'أرفق إشعار التحويل.',
            'receipt.mimes' => 'إشعار التحويل يجب أن يكون صورة أو PDF.',
        ]);

        $order = $this->orders->replaceReceipt(
            $cvOrder,
            $request->file('receipt'),
            $validated['payment_note'] ?? null,
        );

        return response()->json([
            'message' => 'تم استلام الإشعار الجديد، وسنراجعه قريباً.',
            'data' => (new CvOrderResource($order))->resolve(),
        ]);
    }

    /** تحميل الملف النهائي — يُخدَّم من قرص خاص بعد التحقق من الملكية */
    public function downloadFinal(Request $request, CvOrder $cvOrder): StreamedResponse
    {
        abort_unless(
            $cvOrder->user_id === $request->user()->id || $request->user()->isAdminLevel(),
            403,
        );
        abort_unless($cvOrder->final_file_path, 404, 'لم يُسلَّم ملف لهذا الطلب بعد.');

        // مسارٌ في قاعدة البيانات لا يعني ملفاً على القرص — تخزين الحاوية مؤقّت
        abort_unless(
            Storage::disk('local')->exists($cvOrder->final_file_path),
            404,
            'الملف لم يعد موجوداً على الخادم. تواصل معنا لإعادة إرساله.',
        );

        return Storage::disk('local')->download(
            $cvOrder->final_file_path,
            $cvOrder->final_file_name ?? "بَوْصلة-{$cvOrder->order_number}.pdf",
        );
    }

    /** إرسال ملاحظة خاصة إلى الخبير */
    public function addNote(Request $request, CvOrder $cvOrder): CvOrderResource
    {
        // الطالب صاحب الطلب، أو الخبير المسنَد إليه — قناة التواصل بينهما
        abort_unless(
            $cvOrder->user_id === $request->user()->id || $cvOrder->expert_id === $request->user()->id,
            403,
        );

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        $cvOrder->notes()->create([
            'author_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return new CvOrderResource($cvOrder->fresh(self::RELATIONS));
    }
}
