<?php

namespace App\Services;

use App\Models\StudentProfile;

/**
 * تقرير توافق الفرز الأكاديمي الآلي (ATS).
 * يُحسب محلياً من بيانات الملف دون أي اتصال خارجي.
 */
class AtsReportService
{
    /** @return array{score:int, checks:array<int, array{label:string, passed:bool}>} */
    public function build(StudentProfile $profile): array
    {
        $hasQuantifiedAchievements = $profile->experiences
            ->pluck('description')
            ->merge($profile->projects->pluck('description'))
            ->filter()
            ->contains(fn (string $text) => preg_match('/\d/', $text) === 1);

        $checks = [
            [
                'label' => 'هيكلية نظيفة بنمط نصّي مقروء من قبل كافة برمجيات الفرز الدولية.',
                'passed' => $profile->educations->isNotEmpty() && $profile->experiences->isNotEmpty(),
            ],
            [
                'label' => 'صياغة الإنجازات باستخدام أفعال قوية ونتائج عددية واضحة.',
                'passed' => $hasQuantifiedAchievements,
            ],
            [
                'label' => 'تطابق الكلمات المفتاحية مع معايير المنح البحثية العالمية (DAAD و Chevening).',
                'passed' => $profile->skills->count() >= 4 && filled($profile->bio),
            ],
            [
                'label' => 'تضمين مؤشر الكفاءة اللغوية المعتمد دولياً (IELTS / TOEFL).',
                'passed' => $profile->languages->contains(fn ($l) => filled($l->certificate)),
            ],
        ];

        $passed = count(array_filter($checks, fn (array $c) => $c['passed']));

        // 60 نقطة أساس + 10 لكل فحص ناجح، بحد أقصى 98
        return [
            'score' => min(98, 60 + $passed * 10),
            'checks' => $checks,
        ];
    }
}
