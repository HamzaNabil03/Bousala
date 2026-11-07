<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class AccessAccountSeeder extends Seeder
{
    public function run(): void
    {
        $studentEmail = env('ACCESS_STUDENT_EMAIL');
        $studentPassword = env('ACCESS_STUDENT_PASSWORD');
        $adminEmail = env('ACCESS_ADMIN_EMAIL');
        $adminPassword = env('ACCESS_ADMIN_PASSWORD');

        if (! $studentEmail || ! $studentPassword || ! $adminEmail || ! $adminPassword) {
            $this->command?->warn('AccessAccountSeeder skipped: configure ACCESS_* credentials in the local environment.');

            return;
        }

        $student = User::updateOrCreate(
            ['email' => $studentEmail],
            [
                'name' => env('ACCESS_STUDENT_NAME', 'Demo Student'),
                'password' => $studentPassword,
                'role' => UserRole::Student,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
                'accepted_terms_at' => now(),
            ],
        );

        $student->profile()->updateOrCreate(
            ['user_id' => $student->id],
            [
                'full_name_ar' => env('ACCESS_STUDENT_NAME_AR', 'طالب تجريبي'),
                'full_name_en' => env('ACCESS_STUDENT_NAME_EN', 'Demo Student'),
            ],
        );

        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => env('ACCESS_ADMIN_NAME', 'Bousala Admin'),
                'password' => $adminPassword,
                'role' => UserRole::Admin,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
                'accepted_terms_at' => now(),
            ],
        );

        $this->command->info('✓ تم تجهيز حساب الطالب وحساب مدير بوصلة');
    }
}
