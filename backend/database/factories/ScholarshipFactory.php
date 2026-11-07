<?php

namespace Database\Factories;

use App\Enums\DegreeLevel;
use App\Enums\FundingType;
use App\Enums\LanguageRequirement;
use App\Enums\ScholarshipStatus;
use App\Models\Scholarship;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Scholarship>
 */
class ScholarshipFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $titleEn = fake()->unique()->words(3, true).' Scholarship';

        return [
            'slug' => Str::slug($titleEn).'-'.fake()->unique()->numberBetween(1, 99999),
            'title_ar' => 'منحة '.fake()->word(),
            'title_en' => $titleEn,
            'provider' => 'جهة مانحة '.fake()->word(),
            'country_code' => fake()->randomElement(['TR', 'DE', 'GB', 'US', 'JP']),
            'country_name_ar' => fake()->randomElement(['تركيا', 'ألمانيا', 'المملكة المتحدة', 'الولايات المتحدة', 'اليابان']),
            'region' => 'أوروبا',
            'funding_type' => FundingType::Full,
            'language_requirement' => LanguageRequirement::NotRequired,
            'status' => ScholarshipStatus::Published,
            'description' => fake()->paragraph(),
            'deadline' => now()->addDays(fake()->numberBetween(10, 120)),
            'open_date' => now()->subDays(30),
            'min_gpa' => 3.0,
            'gpa_scale' => 4,
            'published_at' => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => ScholarshipStatus::Draft, 'published_at' => null]);
    }

    public function pendingReview(): static
    {
        return $this->state(fn () => ['status' => ScholarshipStatus::PendingReview, 'published_at' => null]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => ScholarshipStatus::Expired,
            'deadline' => now()->subDays(20),
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn () => ['is_featured' => true]);
    }

    /** منحة بمستويات وتخصصات — تحتاجها اختبارات المطابقة */
    public function configured(array $levels = [DegreeLevel::Master], array $majors = ['هندسة البرمجيات']): static
    {
        return $this->afterCreating(function (Scholarship $scholarship) use ($levels, $majors): void {
            foreach ($levels as $level) {
                $scholarship->levels()->create(['level' => $level]);
            }

            foreach ($majors as $major) {
                $scholarship->majors()->create(['name' => $major]);
            }
        });
    }
}
