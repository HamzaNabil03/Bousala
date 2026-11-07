<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => 'Menhity@2026',
            'role' => UserRole::Student,
            'status' => UserStatus::Active,
            'accepted_terms_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => ['email_verified_at' => null]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => ['role' => UserRole::Admin]);
    }

    public function moderator(): static
    {
        return $this->state(fn (array $attributes) => ['role' => UserRole::Moderator]);
    }

    public function expert(): static
    {
        return $this->state(fn (array $attributes) => ['role' => UserRole::Expert]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UserStatus::Suspended,
            'suspended_at' => now(),
            'suspension_reason' => 'مخالفة سياسة الاستخدام',
        ]);
    }

    /** مستخدم لديه ملف أكاديمي فارغ */
    public function withProfile(): static
    {
        return $this->afterCreating(
            fn ($user) => $user->profile()->create(['full_name_ar' => $user->name]),
        );
    }
}
