<?php

namespace App\Services;

use App\Enums\FundingType;
use App\Enums\LanguageRequirement;
use App\Models\Scholarship;
use App\Models\StudentProfile;
use Illuminate\Support\Collection;

/**
 * خوارزمية المطابقة بين ملف الطالب والمنحة.
 * تُنتج نتيجة من 100 مع أسباب مقروءة تظهر تحت "لماذا تناسبني؟".
 */
class MatchingService
{
    private const WEIGHT_LEVEL = 30;

    private const WEIGHT_MAJOR = 25;

    private const WEIGHT_GPA = 20;

    private const WEIGHT_LANGUAGE = 15;

    private const WEIGHT_FUNDING = 10;

    /** @return array{score:int, reasons:array<int, string>} */
    public function match(?StudentProfile $profile, Scholarship $scholarship): array
    {
        // بدون مؤهل دراسي لا يمكن حساب مطابقة ذات معنى
        if (! $profile || $profile->educations->isEmpty()) {
            return ['score' => 0, 'reasons' => []];
        }

        $reasons = [];
        $score = 0;

        $latest = $profile->latestEducation();
        $offeredLevels = $scholarship->levels->pluck('level')->all();

        /* --- 1) مستوى الدراسة --- */
        $target = $latest->degree->next();

        if (in_array($target, $offeredLevels, true)) {
            $score += self::WEIGHT_LEVEL;
            $reasons[] = "المنحة متاحة لمستوى {$target->label()}، وهو المستوى التالي في مسارك الأكاديمي.";
        } elseif (in_array($latest->degree, $offeredLevels, true)) {
            $score += (int) round(self::WEIGHT_LEVEL * 0.5);
            $reasons[] = "المنحة متاحة لمستوى {$latest->degree->label()} المطابق لمؤهلك الحالي.";
        }

        /* --- 2) التخصص --- */
        $scholarshipMajors = $scholarship->majors->pluck('name');

        if ($scholarshipMajors->isEmpty()) {
            $score += (int) round(self::WEIGHT_MAJOR * 0.7);
            $reasons[] = 'المنحة مفتوحة لجميع التخصصات.';
        } else {
            $profileMajors = $profile->educations->pluck('major')->filter();
            $matchedMajor = $scholarshipMajors->first(
                fn (string $m) => $profileMajors->contains(fn (string $pm) => $this->overlaps($pm, $m)),
            );

            if ($matchedMajor) {
                $score += self::WEIGHT_MAJOR;
                $reasons[] = "تخصصك يتوافق مع مجال «{$matchedMajor}» المطلوب في المنحة.";
            } else {
                $related = $profile->skills->pluck('name')->merge($profile->interests->pluck('name'));
                $matchedBySkill = $scholarshipMajors->first(
                    fn (string $m) => $related->contains(fn (string $s) => $this->overlaps($s, $m)),
                );

                if ($matchedBySkill) {
                    $score += (int) round(self::WEIGHT_MAJOR * 0.6);
                    $reasons[] = "مهاراتك واهتماماتك قريبة من مجال «{$matchedBySkill}».";
                }
            }
        }

        /* --- 3) المعدل التراكمي --- */
        $studentGpa = $latest->gpaPercent();
        $requiredGpa = $scholarship->minGpaPercent();

        if ($requiredGpa === null) {
            $score += (int) round(self::WEIGHT_GPA * 0.6);
        } elseif ($studentGpa !== null) {
            if ($studentGpa >= $requiredGpa) {
                $score += self::WEIGHT_GPA;
                $reasons[] = 'معدلك التراكمي يتجاوز الحد الأدنى المطلوب للمنحة.';
            } elseif ($studentGpa >= $requiredGpa - 5) {
                $score += (int) round(self::WEIGHT_GPA * 0.4);
                $reasons[] = 'معدلك قريب جداً من الحد الأدنى المطلوب.';
            }
        }

        /* --- 4) متطلبات اللغة --- */
        if ($scholarship->language_requirement === LanguageRequirement::NotRequired) {
            $score += self::WEIGHT_LANGUAGE;
            $reasons[] = 'لا تشترط هذه المنحة شهادة لغة، وهو ما يسهّل تقديمك.';
        } elseif ($profile->languages->contains(fn ($l) => $l->hasRecognisedCertificate())) {
            $score += self::WEIGHT_LANGUAGE;
            $reasons[] = 'لديك شهادة لغة معتمدة تغطّي متطلبات المنحة.';
        }

        /* --- 5) نوع التمويل --- */
        if ($scholarship->funding_type === FundingType::Full) {
            $score += self::WEIGHT_FUNDING;
            $reasons[] = 'المنحة ممولة بالكامل، وتغطّي تكاليف الدراسة والمعيشة.';
        } else {
            $score += (int) round(self::WEIGHT_FUNDING * 0.5);
        }

        return [
            'score' => max(0, min(100, $score)),
            'reasons' => $reasons,
        ];
    }

    /**
     * يحسب المطابقة لمجموعة منح ويرتّبها تنازلياً.
     *
     * @param  Collection<int, Scholarship>  $scholarships
     * @return Collection<int, array{scholarship:Scholarship, score:int, reasons:array}>
     */
    public function rank(?StudentProfile $profile, Collection $scholarships): Collection
    {
        return $scholarships
            ->map(fn (Scholarship $s) => [
                'scholarship' => $s,
                ...$this->match($profile, $s),
            ])
            ->sortByDesc('score')
            ->values();
    }

    /** تطبيع النص العربي/الإنجليزي قبل المقارنة */
    private function normalize(string $text): string
    {
        $text = mb_strtolower($text);
        $text = preg_replace('/[\x{064B}-\x{0652}]/u', '', $text);   // التشكيل
        $text = str_replace(['أ', 'إ', 'آ'], 'ا', $text);
        $text = str_replace('ى', 'ي', $text);
        $text = str_replace('ة', 'ه', $text);
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);

        return trim(preg_replace('/\s+/u', ' ', $text));
    }

    private function overlaps(string $a, string $b): bool
    {
        $na = $this->normalize($a);
        $nb = $this->normalize($b);

        if ($na === '' || $nb === '') {
            return false;
        }

        if (str_contains($na, $nb) || str_contains($nb, $na)) {
            return true;
        }

        $wordsA = array_filter(explode(' ', $na), fn ($w) => mb_strlen($w) > 2);
        $wordsB = array_filter(explode(' ', $nb), fn ($w) => mb_strlen($w) > 2);

        return count(array_intersect($wordsA, $wordsB)) > 0;
    }
}
