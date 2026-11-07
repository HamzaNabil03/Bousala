<?php

namespace Database\Seeders;

use App\Enums\CvOrderStatus;
use App\Enums\DocumentKind;
use App\Enums\NotificationType;
use App\Enums\TimelineStatus;
use App\Models\ContactMessage;
use App\Models\CvOrder;
use App\Models\Scholarship;
use App\Models\User;
use Illuminate\Database\Seeder;

/** المحفوظات والمطابقات والإشعارات والمستندات وطلب صياغة سيرة ذاتية تجريبي */
class EngagementSeeder extends Seeder
{
    public function run(): void
    {
        $student = User::where('email', 'student@menhity.com')->firstOrFail();
        $expert = User::where('email', 'expert@menhity.com')->firstOrFail();

        $by = fn (string $slugPart) => Scholarship::where('slug', 'like', "%{$slugPart}%")->firstOrFail();

        $turkey = $by('turkiye');
        $daad = $by('daad');
        $chevening = $by('chevening');
        $erasmus = $by('erasmus');
        $fulbright = $by('fulbright');
        $gks = $by('global-korea');

        /* ---------- المحفوظات ---------- */

        foreach ([$erasmus, $fulbright, $chevening] as $scholarship) {
            $student->savedScholarships()->create(['scholarship_id' => $scholarship->id]);
        }

        /* ---------- المطابقات ---------- */

        $student->matches()->createMany([
            [
                'scholarship_id' => $turkey->id,
                'score' => 92,
                'reasons' => [
                    'المنحة متاحة لمستوى ماجستير، وهو المستوى التالي في مسارك الأكاديمي.',
                    'لا تشترط هذه المنحة شهادة لغة، وهو ما يسهّل تقديمك.',
                    'معدلك التراكمي يتجاوز الحد الأدنى المطلوب للمنحة.',
                ],
                'computed_at' => now(),
            ],
            [
                'scholarship_id' => $daad->id,
                'score' => 88,
                'reasons' => [
                    'تخصصك يتوافق مع مجال «علوم الحاسوب» المطلوب في المنحة.',
                    'لديك شهادة لغة معتمدة تغطّي متطلبات المنحة.',
                ],
                'computed_at' => now(),
            ],
            [
                'scholarship_id' => $chevening->id,
                'score' => 75,
                'reasons' => ['المنحة ممولة بالكامل، وتغطّي تكاليف الدراسة والمعيشة.'],
                'computed_at' => now(),
            ],
        ]);

        /* ---------- الإشعارات ---------- */

        $student->notifications()->createMany([
            [
                'type' => NotificationType::NewMatch,
                'title' => 'منحة جديدة تناسبك',
                'body' => 'تم العثور على منحة جديدة تتوافق مع ملفك الأكاديمي.',
                'badge_label' => 'مطابقة 92%',
                'action_label' => 'عرض المنحة',
                'action_url' => "/scholarships/{$turkey->slug}",
                'scholarship_id' => $turkey->id,
                'created_at' => now()->subHours(2),
            ],
            [
                'type' => NotificationType::DeadlineReminder,
                'title' => 'تذكير بموعد التقديم',
                'body' => 'تبقّى وقت قصير على انتهاء التقديم لمنحة تشيفينينغ البريطانية.',
                'badge_label' => 'ينتهي قريباً',
                'action_label' => 'قدّم الآن',
                'action_url' => "/scholarships/{$chevening->slug}",
                'scholarship_id' => $chevening->id,
                'created_at' => now()->subHours(5),
            ],
            [
                'type' => NotificationType::DocumentReviewed,
                'title' => 'اكتمال مراجعة المستندات بنجاح',
                'body' => 'تم التحقق من سيرتك الذاتية ومستنداتك وجاهزيتها للتقديم بنجاح.',
                'badge_label' => 'تم بنجاح',
                'action_label' => 'استعراض الملف',
                'action_url' => '/dashboard/documents',
                'read_at' => now(),
                'created_at' => now()->subDays(2),
            ],
            [
                'type' => NotificationType::SavedUpdated,
                'title' => 'تحديث المحفوظات',
                'body' => 'تم تحديث مقاعد التقديم والشروط المطلوبة في منحة محفوظة لديك.',
                'badge_label' => 'محدّث',
                'action_label' => 'عرض التفاصيل',
                'action_url' => '/dashboard/saved',
                'read_at' => now(),
                'created_at' => now()->subDays(4),
            ],
            [
                'type' => NotificationType::DeadlinePassed,
                'title' => 'انتهاء موعد التقديم لمنحة الحكومة الكورية GKS',
                'body' => 'أُغلق باب استقبال الطلبات رسمياً لهذه الدورة. يمكنك تصفّح فرص بديلة متطابقة مع مؤهلاتك.',
                'badge_label' => 'منتهية',
                'action_label' => 'اكتشف منحاً بديلة',
                'action_url' => '/scholarships',
                'scholarship_id' => $gks->id,
                'read_at' => now(),
                'created_at' => now()->subDays(14),
            ],
        ]);

        /* ---------- المستندات ---------- */

        $student->documents()->createMany([
            [
                'kind' => DocumentKind::Cv,
                'original_name' => 'Ahmed_CV_2026.pdf',
                'stored_name' => 'sample-cv.pdf',
                'mime_type' => 'application/pdf',
                'size_bytes' => 2_516_582,
                'path' => 'documents/sample-cv.pdf',
            ],
            [
                'kind' => DocumentKind::MotivationLetter,
                'original_name' => 'Motivation_Letter.docx',
                'stored_name' => 'sample-letter.docx',
                'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'size_bytes' => 1_153_433,
                'path' => 'documents/sample-letter.docx',
            ],
            [
                'kind' => DocumentKind::Transcript,
                'original_name' => 'Transcripts_BSc.pdf',
                'stored_name' => 'sample-transcript.pdf',
                'mime_type' => 'application/pdf',
                'size_bytes' => 5_872_025,
                'path' => 'documents/sample-transcript.pdf',
            ],
        ]);

        /* ---------- طلب صياغة سيرة ذاتية ---------- */

        $order = CvOrder::create([
            'order_number' => 'MNH-CV-8921',
            'user_id' => $student->id,
            'expert_id' => $expert->id,
            'status' => CvOrderStatus::InExpertReview,
            'current_step' => 5,
            'ats_score' => 98,
            'submitted_at' => now()->subHours(6),
            'expected_delivery_at' => now()->addHours(42),
            'data_snapshot' => ['source' => 'seed'],
        ]);

        $order->timeline()->createMany([
            [
                'title' => 'استلام ومطابقة البيانات الأكاديمية والوثائق المدخلة',
                'status' => TimelineStatus::Done,
                'sort_order' => 0,
                'occurred_at' => now()->subHours(6),
            ],
            [
                'title' => 'المراجعة اليدوية وإعادة صياغة الإنجازات بلغة المنح الأكاديمية',
                'status' => TimelineStatus::InProgress,
                'sort_order' => 1,
                'occurred_at' => now()->subHours(2),
            ],
            [
                'title' => 'الفحص الدقيق لمعايير ATS والتنسيق الأكاديمي الدولي المعتمد',
                'status' => TimelineStatus::Pending,
                'sort_order' => 2,
            ],
            [
                'title' => 'تسليم النسخة النهائية واعتمادها للتنزيل المباشر',
                'status' => TimelineStatus::Pending,
                'sort_order' => 3,
            ],
        ]);

        $order->atsChecks()->createMany([
            ['label' => 'هيكلية نظيفة بنمط نصّي مقروء من قبل كافة برمجيات الفرز الدولية.', 'passed' => true, 'sort_order' => 0],
            ['label' => 'صياغة الإنجازات باستخدام أفعال قوية ونتائج عددية واضحة.', 'passed' => true, 'sort_order' => 1],
            ['label' => 'تطابق الكلمات المفتاحية مع معايير المنح البحثية العالمية (DAAD و Chevening).', 'passed' => true, 'sort_order' => 2],
            ['label' => 'تضمين مؤشر الكفاءة اللغوية المعتمد دولياً (IELTS 7.5).', 'passed' => true, 'sort_order' => 3],
        ]);

        $order->notes()->create([
            'author_id' => $expert->id,
            'body' => 'تم استلام ملفك وبدأت المراجعة. سأركّز على إبراز مشروع التخرّج والنتائج العددية.',
        ]);

        /* ---------- رسالة تواصل ---------- */

        ContactMessage::create([
            'name' => 'خالد يوسف',
            'email' => 'khaled@example.com',
            'subject' => 'استفسار عن المنحة التركية',
            'body' => 'السلام عليكم، أرغب بمعرفة إن كانت المنحة التركية تقبل خريجي الدبلوم أم البكالوريوس فقط. شكراً لكم.',
        ]);

        $this->command->info('✓ تم إنشاء المحفوظات والمطابقات والإشعارات وطلب صياغة تجريبي');
    }
}
