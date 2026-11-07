<?php

namespace Database\Seeders;

use App\Enums\DegreeLevel;
use App\Enums\ExperienceType;
use App\Enums\Gender;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Services\ProfileCompletionService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Never keep a reusable account credential in source control. Set
        // SEED_USER_PASSWORD locally when predictable demo logins are needed.
        $password = env('SEED_USER_PASSWORD') ?: Str::random(32);

        /*
         * حسابات التشغيل تحمل اسم الدور لا اسماً شخصياً: هي حسابات نظام
         * يتشاركها الفريق، فاسم شخص عليها يضلّل من يقرأ سجلّ الإجراءات.
         */

        User::create([
            'name' => 'Admin',
            'email' => 'admin@menhity.com',
            'password' => $password,
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
            'accepted_terms_at' => now(),
        ]);

        User::create([
            'name' => 'Moderator',
            'email' => 'moderator@menhity.com',
            'password' => $password,
            'role' => UserRole::Moderator,
            'email_verified_at' => now(),
            'accepted_terms_at' => now(),
        ]);

        $expert = User::create([
            'name' => 'Expert',
            'email' => 'expert@menhity.com',
            'password' => $password,
            'role' => UserRole::Expert,
            'email_verified_at' => now(),
            'accepted_terms_at' => now(),
        ]);

        $expert->expertProfile()->create([
            'title_prefix' => 'د.',
            'specialization' => 'استشاري قبولات ومنح دولية',
            'bio' => 'باحث ومستشار أكاديمي، أشرف على أكثر من 600 ملف تقديم لبرامج المنح الدولية.',
        ]);

        /* ---------- الطالب صاحب الملف المكتمل ---------- */

        $student = User::create([
            'name' => 'Student',
            'email' => 'student@menhity.com',
            'password' => $password,
            'role' => UserRole::Student,
            'phone' => '+970 59 912 3456',
            'email_verified_at' => now(),
            'accepted_terms_at' => now(),
        ]);

        $profile = $student->profile()->create([
            'full_name_ar' => 'أحمد محمد عبدالله سالم',
            'full_name_en' => 'Ahmed Mohamed Abdullah Salem',
            'academic_email' => 'ahmed.salem@example.com',
            'nationality' => 'فلسطيني',
            'gender' => Gender::Male,
            'country' => 'فلسطين',
            'city' => 'غزة',
            'birth_date' => '1999-03-15',
            'linkedin_url' => 'https://linkedin.com/in/ahmed-salem',
            'portfolio_url' => 'https://ahmedsalem.dev',
            'headline' => 'طالب هندسة برمجيات',
            'bio' => 'طالب هندسة برمجيات شغوف بالذكاء الاصطناعي وعلوم البيانات. أمتلك خبرة عملية في تطوير حلول الويب والمشاركة في المشاريع البحثية، وأطمح لإتمام دراساتي العليا عبر منحة دراسية متقدمة للإسهام في رقمنة الخدمات التعليمية.',
        ]);

        $profile->educations()->createMany([
            [
                'degree' => DegreeLevel::Bachelor,
                'major' => 'هندسة البرمجيات',
                'institution' => 'الجامعة الإسلامية بغزة',
                'country' => 'فلسطين',
                'graduation_year' => 2027,
                'gpa_value' => 3.88,
                'gpa_scale' => 4,
                'honors' => 'امتياز مع مرتبة الشرف',
                'is_current' => true,
                'thesis_title' => 'منصة رقمية ذكية لتحليل وتقييم فرص قبول المنح بالذكاء الاصطناعي',
                'sort_order' => 0,
            ],
            [
                'degree' => DegreeLevel::HighSchool,
                'major' => 'علمي',
                'institution' => 'مدرسة دار العلوم',
                'country' => 'فلسطين',
                'graduation_year' => 2017,
                'gpa_value' => 99,
                'gpa_scale' => 100,
                'sort_order' => 1,
            ],
        ]);

        $profile->experiences()->create([
            'title' => 'مطوّر برمجيات متدرّب وباحث مساعد',
            'type' => ExperienceType::Research,
            'organization' => 'مركز الابتكار التكنولوجي الطلابي',
            'country' => 'فلسطين',
            'city' => 'غزة',
            'start_date' => '2024-01-01',
            'is_current' => true,
            'description' => 'المساهمة في بناء منصات ويب تفاعلية لخدمة أكثر من 3000 طالب وباحث، والمشاركة في إعداد وتوثيق أدوات الذكاء الاصطناعي التطبيقي.',
            'sort_order' => 0,
        ]);

        foreach ([
            'Full-Stack Web (React/Node)',
            'Python & Data Analysis',
            'البحث العلمي والتوثيق الأكاديمي',
            'القيادة وإدارة المشاريع',
            'التعلم الآلي (Machine Learning)',
        ] as $skill) {
            $profile->skills()->create(['name' => $skill]);
        }

        $profile->languages()->createMany([
            ['name' => 'العربية', 'proficiency' => 'اللغة الأم'],
            ['name' => 'الإنجليزية', 'proficiency' => 'متقدم (C1)', 'certificate' => 'IELTS 7.5'],
        ]);

        $profile->certifications()->createMany([
            [
                'title' => 'شهادة محترف الذكاء الاصطناعي (DeepLearning.AI)',
                'issuer' => 'Coursera',
                'credential_id' => 'DL-AI-2024-6891',
                'issue_date' => '2024-06-01',
            ],
            [
                'title' => 'شهادة اجتياز اختبار IELTS الأكاديمي بمعدل 7.5',
                'issuer' => 'British Council',
                'credential_id' => 'C1-Advanced',
                'issue_date' => '2025-02-10',
            ],
        ]);

        $profile->projects()->create([
            'title' => 'مشروع تخرّج حائز على جائزة التميّز للابتكار الرقمي',
            'description' => 'مشروع تخرّج تطبيقي حاز على المركز الأول في معرض مشاريع التخرّج الجامعية، واستخدمه أكثر من 1000 طالب وباحث في تسريع عمليات البحث والتقديم للمنح.',
            'year' => 2024,
        ]);

        $profile->interests()->createMany([
            ['name' => 'الذكاء الاصطناعي'],
            ['name' => 'علوم البيانات'],
        ]);

        app(ProfileCompletionService::class)->refresh($student);

        /* ---------- طلاب إضافيون لتغذية إحصائيات لوحة الإدارة ---------- */

        $extras = [
            ['سارة علي', 'sara@example.com', UserStatus::Active],
            ['محمد حسن', 'mohamed@example.com', UserStatus::Inactive],
            ['لينا خالد', 'lina@example.com', UserStatus::Suspended],
            ['نور أحمد', 'nour@example.com', UserStatus::Active],
            ['إيمان شعبان', 'eman@example.com', UserStatus::Active],
        ];

        foreach ($extras as [$name, $email, $status]) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'role' => UserRole::Student,
                'status' => $status,
                'suspended_at' => $status === UserStatus::Suspended ? now() : null,
                'suspension_reason' => $status === UserStatus::Suspended
                    ? 'مخالفة سياسة الاستخدام / تكرار الإرسال'
                    : null,
                'email_verified_at' => now(),
                'accepted_terms_at' => now(),
            ]);

            $user->profile()->create(['full_name_ar' => $name]);
        }

        $this->command->info('✓ تم إنشاء '.User::count().' مستخدماً');
    }
}
