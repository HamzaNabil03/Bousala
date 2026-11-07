<?php

namespace App\Services;

use App\Enums\CvOrderKind;
use App\Enums\CvOrderStatus;
use App\Enums\NotificationType;
use App\Enums\PaymentStatus;
use App\Enums\TimelineStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\CvOrder;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/** إنشاء طلبات صياغة السيرة الذاتية وتحريك مراحلها */
class CvOrderService
{
    /** العلاقات التي تحتاجها شاشة متابعة الطلب */
    private const RELATIONS = ['timeline', 'atsChecks', 'notes.author', 'expert.expertProfile'];

    /**
     * مراحل العمل الخمس — مطابقة للتايملاين في الواجهة.
     * مرحلة التحويل أولها دائماً، وتُعلَّم منتهية فوراً في الخدمة المجانية،
     * فيبقى للمراحل ترتيب واحد لا يختلف بين طلب مدفوع وآخر مجاني.
     */
    public const TIMELINE_STEPS = [
        'استلام إشعار التحويل والتأكّد منه',
        'استلام ومطابقة البيانات الأكاديمية والوثائق المدخلة',
        'المراجعة اليدوية وإعادة صياغة الإنجازات بلغة المنح الأكاديمية',
        'الفحص الدقيق لمعايير ATS والتنسيق الأكاديمي الدولي المعتمد',
        'تسليم النسخة النهائية واعتمادها للتنزيل المباشر',
    ];

    public function __construct(
        private readonly AtsReportService $ats,
        private readonly SettingsService $settings,
    ) {}

    /**
     * شروط جاهزية الملف للإرسال.
     *
     * @return array<int, array{label:string, done:bool, required:bool}>
     */
    public function readiness(StudentProfile $profile): array
    {
        return [
            [
                'label' => 'المعلومات الشخصية والنبذة',
                'done' => filled($profile->full_name_ar) && filled($profile->bio),
                'required' => true,
            ],
            [
                'label' => 'مؤهل دراسي واحد على الأقل',
                'done' => $profile->educations->isNotEmpty(),
                'required' => true,
            ],
            [
                'label' => 'خبرة أو مشروع واحد على الأقل',
                'done' => $profile->experiences->isNotEmpty() || $profile->projects->isNotEmpty(),
                'required' => false,
            ],
            [
                'label' => '3 مهارات على الأقل',
                'done' => $profile->skills->count() >= 3,
                'required' => false,
            ],
            [
                'label' => 'لغة واحدة على الأقل',
                'done' => $profile->languages->isNotEmpty(),
                'required' => false,
            ],
        ];
    }

    /** إنشاء الطلب وإسناده لأقلّ الخبراء انشغالاً */
    public function submit(
        User $user,
        StudentProfile $profile,
        CvOrderKind $kind = CvOrderKind::CvBuild,
        ?UploadedFile $sourceFile = null,
        ?string $note = null,
        ?UploadedFile $receiptFile = null,
        ?string $paymentNote = null,
    ): CvOrder {
        /*
         * اكتمال الملف الأكاديمي شرط للكتابة من الصفر — سيرة أو خطاب — فهي
         * تُبنى منه. أما التحسين فيبدأ من ملف يرفعه الطالب، فالشرط عليه أن
         * يرفعه.
         */
        if (! $kind->requiresSourceFile()) {
            foreach ($this->readiness($profile) as $requirement) {
                if ($requirement['required'] && ! $requirement['done']) {
                    throw new RuntimeException("أكمل «{$requirement['label']}» قبل إرسال الطلب.");
                }
            }
        } elseif (! $sourceFile) {
            throw new RuntimeException('أرفق ملفك الحالي ليتمكّن الفريق من تحسينه.');
        }

        /*
         * السعر يُقرأ الآن ويُجمَّد على الطلب: تعديل المدير له لاحقاً يجب ألا
         * يغيّر ما اتّفق عليه طالبٌ أرسل طلبه وحوّل بالسعر القديم.
         */
        $price = $this->settings->priceFor($kind);
        $isPaid = $price > 0;

        if ($isPaid && ! $this->settings->hasPaymentDetails()) {
            throw new RuntimeException('خدمة الدفع غير مهيّأة بعد. تواصل معنا لإتمام طلبك.');
        }

        if ($isPaid && ! $receiptFile) {
            throw new RuntimeException('أرفق إشعار التحويل ليتمكّن الفريق من تأكيد الدفع.');
        }

        // قرص خاص لا عام: هذه مستندات شخصية لا يجوز الوصول إليها برابط مباشر
        $sourcePath = $sourceFile?->store('cv-orders/source', 'local');
        $receiptPath = $receiptFile?->store('cv-orders/receipts', 'local');

        $expert = User::where('role', UserRole::Expert)
            ->where('status', UserStatus::Active)
            ->withCount('assignedCvOrders')
            ->orderBy('assigned_cv_orders_count')
            ->first();

        $report = $this->ats->build($profile);

        return DB::transaction(function () use ($user, $profile, $expert, $report, $kind, $sourceFile, $sourcePath, $note, $receiptFile, $receiptPath, $price, $isPaid, $paymentNote): CvOrder {
            $order = CvOrder::create([
                'order_number' => CvOrder::generateOrderNumber(),
                'user_id' => $user->id,
                'kind' => $kind,
                'source_file_path' => $sourcePath,
                'source_file_name' => $sourceFile?->getClientOriginalName(),
                'request_note' => $note,
                'price_amount' => $price,
                'price_currency' => $this->settings->currency(),
                'payment_status' => $isPaid ? PaymentStatus::AwaitingReview : PaymentStatus::NotRequired,
                'receipt_file_path' => $receiptPath,
                'receipt_file_name' => $receiptFile?->getClientOriginalName(),
                'payment_note' => $paymentNote,
                'expert_id' => $expert?->id,
                // المدفوع ينتظر تأكيد التحويل قبل أن يبدأ الفريق العمل عليه
                'status' => $isPaid ? CvOrderStatus::PendingApproval : CvOrderStatus::InExpertReview,
                'current_step' => 5,
                'ats_score' => $report['score'],
                'submitted_at' => now(),
                'expected_delivery_at' => now()->addHours(config('menhity.cv_order_sla_hours')),
                'data_snapshot' => [
                    'full_name_ar' => $profile->full_name_ar,
                    'full_name_en' => $profile->full_name_en,
                    'bio' => $profile->bio,
                    'educations' => $profile->educations->count(),
                    'experiences' => $profile->experiences->count(),
                    'skills' => $profile->skills->pluck('name')->all(),
                    'languages' => $profile->languages
                        ->map(fn ($l) => "{$l->name} — {$l->proficiency}")
                        ->all(),
                ],
            ]);

            // المدفوع يقف عند مرحلة التحويل، والمجاني يتجاوزها إلى العمل مباشرة
            $reached = $isPaid ? 0 : 2;

            foreach (self::TIMELINE_STEPS as $index => $title) {
                $order->timeline()->create([
                    'title' => $title,
                    'sort_order' => $index,
                    'status' => match (true) {
                        $index < $reached => TimelineStatus::Done,
                        $index === $reached => TimelineStatus::InProgress,
                        default => TimelineStatus::Pending,
                    },
                    'occurred_at' => $index <= $reached ? now() : null,
                ]);
            }

            foreach ($report['checks'] as $index => $check) {
                $order->atsChecks()->create([
                    'label' => $check['label'],
                    'passed' => $check['passed'],
                    'sort_order' => $index,
                ]);
            }

            $user->notifications()->create([
                'type' => NotificationType::OrderUpdate,
                'title' => 'تم استلام طلبك: '.$kind->label(),
                'body' => $isPaid
                    ? "رقم الطلب {$order->order_number}. نراجع إشعار التحويل، وفور تأكيده يبدأ الفريق العمل على ملفك."
                    : "رقم الطلب {$order->order_number}. سيعمل الفريق على ملفك ويسلّمك النسخة النهائية خلال 24–48 ساعة عمل.",
                'badge_label' => $isPaid ? 'بانتظار تأكيد التحويل' : 'قيد المراجعة',
                'action_label' => 'متابعة الطلب',
                'action_url' => "/tools/cv-builder/{$order->id}",
            ]);

            return $order;
        });
    }

    /**
     * قبول إشعار التحويل: هنا يبدأ العمل فعلياً على الطلب المدفوع.
     */
    public function acceptPayment(CvOrder $order, User $reviewer): CvOrder
    {
        DB::transaction(function () use ($order, $reviewer): void {
            $order->update([
                'payment_status' => PaymentStatus::Accepted,
                'payment_rejection_reason' => null,
                'payment_reviewed_at' => now(),
                'payment_reviewed_by' => $reviewer->id,
                'status' => CvOrderStatus::InExpertReview,
                // المهلة تبدأ من تأكيد التحويل لا من إرسال الطلب
                'expected_delivery_at' => now()->addHours(config('menhity.cv_order_sla_hours')),
            ]);

            $this->syncTimeline($order, CvOrderStatus::InExpertReview);

            $order->user->notifications()->create([
                'type' => NotificationType::OrderUpdate,
                'title' => 'تم تأكيد تحويلك ✅',
                'body' => "تأكّدنا من إشعار التحويل للطلب {$order->order_number}، وبدأ الفريق العمل على ملفك.",
                'badge_label' => 'تم تأكيد التحويل',
                'action_label' => 'متابعة الطلب',
                'action_url' => "/tools/cv-builder/{$order->id}",
            ]);
        });

        return $order->fresh(self::RELATIONS);
    }

    /**
     * رفض الإشعار: الطلب يبقى قائماً ليرفع الطالب إشعاراً صحيحاً بدل أن يُلغى.
     */
    public function rejectPayment(CvOrder $order, User $reviewer, string $reason): CvOrder
    {
        DB::transaction(function () use ($order, $reviewer, $reason): void {
            $order->update([
                'payment_status' => PaymentStatus::Rejected,
                'payment_rejection_reason' => $reason,
                'payment_reviewed_at' => now(),
                'payment_reviewed_by' => $reviewer->id,
                'status' => CvOrderStatus::PendingApproval,
            ]);

            $order->user->notifications()->create([
                'type' => NotificationType::OrderUpdate,
                'title' => 'إشعار التحويل يحتاج مراجعة',
                'body' => "لم نتمكّن من تأكيد التحويل للطلب {$order->order_number}: {$reason}",
                'badge_label' => 'إشعار مرفوض',
                'action_label' => 'رفع إشعار جديد',
                'action_url' => "/tools/cv-builder/{$order->id}",
            ]);
        });

        return $order->fresh(self::RELATIONS);
    }

    /**
     * رفع إشعار بديل بعد رفض الأول — يستبدل الملف السابق ويعيد الطلب للمراجعة.
     */
    public function replaceReceipt(CvOrder $order, UploadedFile $receipt, ?string $note = null): CvOrder
    {
        $previous = $order->receipt_file_path;
        $path = $receipt->store('cv-orders/receipts', 'local');

        $order->update([
            'receipt_file_path' => $path,
            'receipt_file_name' => $receipt->getClientOriginalName(),
            'payment_note' => $note,
            'payment_status' => PaymentStatus::AwaitingReview,
            'payment_rejection_reason' => null,
            'payment_reviewed_at' => null,
            'payment_reviewed_by' => null,
            'status' => CvOrderStatus::PendingApproval,
        ]);

        if ($previous) {
            Storage::disk('local')->delete($previous);
        }

        return $order->fresh(self::RELATIONS);
    }

    /** يوائم مراحل التايملاين مع حالة الطلب */
    private function syncTimeline(CvOrder $order, CvOrderStatus $status): void
    {
        $target = $status->timelineIndex();

        if ($target === null) {
            return;
        }

        foreach ($order->timeline()->get() as $index => $event) {
            $event->update([
                'status' => match (true) {
                    $status === CvOrderStatus::Delivered => TimelineStatus::Done,
                    $index < $target => TimelineStatus::Done,
                    $index === $target => TimelineStatus::InProgress,
                    default => TimelineStatus::Pending,
                },
                'occurred_at' => $index <= $target ? ($event->occurred_at ?? now()) : null,
            ]);
        }
    }

    /** تحريك الطلب إلى مرحلة جديدة ومواءمة التايملاين معها */
    /**
     * تسليم الملف النهائي الذي أعدّه الفريق يدوياً.
     * يستبدل أي ملف سُلّم سابقاً حتى لا تتراكم نسخ مهجورة على القرص.
     */
    public function deliver(CvOrder $order, UploadedFile $file): CvOrder
    {
        $this->guardPaymentCleared($order, 'لا يمكن تسليم الملف قبل تأكيد التحويل.');

        $previous = $order->final_file_path;
        $path = $file->store('cv-orders/final', 'local');

        DB::transaction(function () use ($order, $file, $path): void {
            $order->update([
                'final_file_path' => $path,
                'final_file_name' => $file->getClientOriginalName(),
                'status' => CvOrderStatus::Delivered,
                'delivered_at' => now(),
            ]);

            $order->timeline()->update(['status' => TimelineStatus::Done, 'occurred_at' => now()]);

            $order->user->notifications()->create([
                'type' => NotificationType::OrderUpdate,
                'title' => 'ملفك جاهز للتحميل',
                'body' => "أنهى الفريق العمل على طلبك {$order->order_number}. حمّل النسخة النهائية الآن.",
                'badge_label' => 'تم التسليم',
                'action_label' => 'تحميل الملف',
                'action_url' => "/tools/cv-builder/{$order->id}",
            ]);
        });

        if ($previous) {
            Storage::disk('local')->delete($previous);
        }

        return $order->refresh();
    }

    public function advance(CvOrder $order, CvOrderStatus $status): CvOrder
    {
        $this->guardPaymentCleared($order, 'لا يمكن تحريك الطلب قبل تأكيد التحويل.');

        DB::transaction(function () use ($order, $status): void {
            $this->syncTimeline($order, $status);

            $order->update([
                'status' => $status,
                'delivered_at' => $status === CvOrderStatus::Delivered ? now() : null,
            ]);

            $order->user->notifications()->create([
                'type' => NotificationType::OrderUpdate,
                'title' => $status === CvOrderStatus::Delivered
                    ? 'سيرتك الذاتية جاهزة 🎉'
                    : 'تحديث على طلب صياغة سيرتك الذاتية',
                'body' => "رقم الطلب {$order->order_number}: {$status->label()}.",
                'badge_label' => $status->label(),
                'action_label' => 'متابعة الطلب',
                'action_url' => "/tools/cv-builder/{$order->id}",
            ]);
        });

        return $order->fresh(self::RELATIONS);
    }

    /**
     * حذف الطلب من اللوحة — حذفٌ ناعم يبقى بعده السجلّ.
     *
     * يجوز الحذف في أي مرحلة، وبعد تأكيد التحويل كذلك: قد يُكرَّر الطلب
     * أو يُلغى بالاتّفاق أو يُرسَل خطأً. لكنّ المال الذي وصل لا يمحوه زرّ،
     * فيبقى السجلّ ومرفقاته وسبب الحذف ومَن حذفه للمراجعة والمحاسبة.
     *
     * والطالب يُخطَر دائماً: طلبٌ اختفى من لوحته بلا كلمة أسوأ من رفضٍ
     * مُعلَّل، وأسوأ منهما أن يكون قد دفع ثمنه.
     */
    public function remove(CvOrder $order, User $admin, string $reason): CvOrder
    {
        DB::transaction(function () use ($order, $admin, $reason): void {
            $paid = $order->payment_status === PaymentStatus::Accepted;

            $order->user->notifications()->create([
                'type' => NotificationType::OrderUpdate,
                'title' => 'أُلغي طلبك: '.$order->kind->label(),
                'body' => $paid
                    ? "أُلغي الطلب {$order->order_number} بعد تأكيد تحويلك: {$reason} — تواصل معنا بخصوص المبلغ المحوَّل."
                    : "أُلغي الطلب {$order->order_number}: {$reason}",
                'badge_label' => 'ملغى',
                'action_label' => 'تواصل معنا',
                'action_url' => '/contact',
            ]);

            $order->update([
                'deletion_reason' => $reason,
                'deleted_by' => $admin->id,
            ]);

            $order->delete();
        });

        return $order;
    }

    /** التراجع عن حذف: يعود الطلب كما كان بحالته ومرفقاته */
    public function restore(CvOrder $order, User $admin): CvOrder
    {
        DB::transaction(function () use ($order): void {
            $order->restore();

            $order->update([
                'deletion_reason' => null,
                'deleted_by' => null,
            ]);

            $order->user->notifications()->create([
                'type' => NotificationType::OrderUpdate,
                'title' => 'أُعيد طلبك: '.$order->kind->label(),
                'body' => "عاد الطلب {$order->order_number} إلى المتابعة بعد مراجعة إلغائه.",
                'badge_label' => $order->status->label(),
                'action_label' => 'متابعة الطلب',
                'action_url' => "/tools/cv-builder/{$order->id}",
            ]);
        });

        return $order->fresh(self::RELATIONS);
    }

    /** العمل على طلب مدفوع لم يُؤكَّد تحويله بعد يسبق الدفع نفسه */
    private function guardPaymentCleared(CvOrder $order, string $message): void
    {
        if ($order->payment_status->blocksWork()) {
            throw new RuntimeException($message);
        }
    }
}
