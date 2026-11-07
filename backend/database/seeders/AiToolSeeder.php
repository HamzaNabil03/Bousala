<?php

namespace Database\Seeders;

use App\Enums\AiRunStatus;
use App\Enums\UserRole;
use App\Models\AiTool;
use App\Models\User;
use Illuminate\Database\Seeder;

class AiToolSeeder extends Seeder
{
    public function run(): void
    {
        /*
         * لا مسار ذكاء اصطناعي فوري إطلاقاً: الخدمة الوحيدة لتجهيز
         * السيرة الذاتية وخطاب الدافع هي الخدمة اليدوية بإشراف خبير من
         * فريق بَوْصلة. تُنشأ الأدوات معطَّلة من البداية — تبقى بيانات
         * توضيحية في لوحة الإدارة، وتُفعَّل يدوياً إن احتيج لها لاحقاً.
         */
        $tools = [
            ['cv-enhancer', 'تحسين السيرة الذاتية', 'حلّل سيرتك الذاتية الحالية واقترح تحسينات تجعلها أكثر احترافية وملاءمة للمنح.', 'Wand2'],
            ['letter-builder', 'إنشاء خطاب الدافع', 'أنشئ خطاب دافع مخصص بناءً على معلومات المستند والمنحة التي تقدّم إليها.', 'PenLine'],
            ['letter-enhancer', 'تحسين خطاب الدافع', 'حلّل خطاب الدافع واقترح تحسينات على المحتوى والأسلوب ومدى ملاءمته للمنحة.', 'Sparkles'],
            ['profile-review', 'تقييم الملف الشخصي', 'تقييم مدى جاهزية ملفك للتقديم على المنح وتحديد نقاط القوة والفجوات التي تحتاج إلى تحسين.', 'Star'],
        ];

        $students = User::where('role', UserRole::Student)->get();

        foreach ($tools as $index => [$key, $nameAr, $description, $icon]) {
            $tool = AiTool::create([
                'key' => $key,
                'name_ar' => $nameAr,
                'description' => $description,
                'icon' => $icon,
                'sort_order' => $index,
                'is_active' => false,
            ]);

            // سجلّات استخدام حديثة لتغذية جدول "آخر الاستخدامات"
            for ($i = 0; $i < 4; $i++) {
                $failed = $index === 1 && $i === 0;

                $tool->runs()->create([
                    'user_id' => $students[($index + $i) % $students->count()]->id,
                    'status' => $failed ? AiRunStatus::Failed : AiRunStatus::Success,
                    'duration_ms' => random_int(1200, 4200),
                    'error_message' => $failed ? 'انتهت مهلة الاتصال بمزوّد الذكاء الاصطناعي.' : null,
                    'output' => $failed ? null : 'ناتج تجريبي.',
                    'created_at' => now()->subMinutes(($index * 4 + $i) * 7),
                ]);
            }
        }

        $this->command->info('✓ تم إنشاء '.AiTool::count().' أدوات ذكاء اصطناعي');
    }
}
