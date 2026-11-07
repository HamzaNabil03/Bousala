<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\User;

/**
 * حساب نسبة اكتمال الملف الأكاديمي.
 * الأقسام وأوزانها مطابقة للتشيك ليست المعروضة في شاشة "نظرة عامة".
 */
class ProfileCompletionService
{
    /** @return array{percent:int, sections:array<int, array<string, mixed>>} */
    public function evaluate(?StudentProfile $profile): array
    {
        $sections = [
            [
                'key' => 'personal',
                'label' => 'المعلومات الشخصية',
                'weight' => 25,
                'done' => (bool) ($profile?->full_name_ar && $profile->country && $profile->bio),
                'hint' => 'أضف اسمك الكامل، بلدك، ونبذة مختصرة عنك.',
            ],
            [
                'key' => 'education',
                'label' => 'التعليم',
                'weight' => 25,
                'done' => ($profile?->educations->count() ?? 0) > 0,
                'hint' => 'أضف مؤهلك الدراسي الحالي أو الأحدث.',
            ],
            [
                'key' => 'major',
                'label' => 'التخصص',
                'weight' => 15,
                'done' => (bool) $profile?->educations->contains(fn ($e) => filled($e->major)),
                'hint' => 'حدّد تخصصك الأكاديمي لتحسين دقة المطابقة.',
            ],
            [
                'key' => 'skills',
                'label' => 'المهارات',
                'weight' => 15,
                'done' => ($profile?->skills->count() ?? 0) >= 3,
                'hint' => 'أضف 3 مهارات على الأقل.',
            ],
            [
                'key' => 'languages',
                'label' => 'اللغات',
                'weight' => 10,
                'done' => ($profile?->languages->count() ?? 0) > 0,
                'hint' => 'أضف اللغات التي تتقنها ومستوى إتقانك.',
            ],
            [
                'key' => 'interests',
                'label' => 'الاهتمامات',
                'weight' => 10,
                'done' => ($profile?->interests->count() ?? 0) > 0,
                'hint' => 'أضف مجالات اهتمامك لنقترح عليك منحاً أنسب.',
            ],
        ];

        $percent = array_sum(array_map(
            fn (array $s) => $s['done'] ? $s['weight'] : 0,
            $sections,
        ));

        return ['percent' => $percent, 'sections' => $sections];
    }

    /** يعيد الحساب ويخزّن النتيجة في الملف */
    public function refresh(User $user): int
    {
        $profile = $user->profile()->with(StudentProfile::FULL_RELATIONS)->first();

        if (! $profile) {
            return 0;
        }

        $percent = $this->evaluate($profile)['percent'];

        if ($profile->completion_percent !== $percent) {
            $profile->update(['completion_percent' => $percent]);
        }

        return $percent;
    }
}
