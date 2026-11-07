<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            AccessAccountSeeder::class,
            DynamicServiceSeeder::class,
            ScholarshipSeeder::class,
            AiToolSeeder::class,
            EngagementSeeder::class,
        ]);

        $this->command->newLine();
        $this->command->info('✅ اكتملت التعبئة بنجاح');
        $this->command->line('──────────────────────────────────────');
        $this->command->line('حسابات الدخول التجريبية (كلمة المرور من SEED_USER_PASSWORD أو قيمة عشوائية)');
        $this->command->line('  المدير    : admin@menhity.com');
        $this->command->line('  المشرف    : moderator@menhity.com');
        $this->command->line('  الخبير    : expert@menhity.com');
        $this->command->line('  الطالب    : student@menhity.com');
        $this->command->line('──────────────────────────────────────');
    }
}
