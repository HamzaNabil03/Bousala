<?php

namespace App\Services;

use App\Enums\DegreeLevel;
use App\Enums\FundingType;
use App\Enums\LanguageRequirement;
use App\Models\Scholarship;
use App\Models\ScholarshipMajor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * بناء استعلام المنح من معايير التصفية القادمة في عنوان الطلب.
 * القيم المتعددة تُرسل مفصولة بفواصل: ?country=TR,DE&level=master
 */
class ScholarshipQueryService
{
    /** @return array<string, mixed> */
    public function parseFilters(Request $request): array
    {
        $list = function (string $key) use ($request): array {
            $raw = $request->query($key);

            if (blank($raw)) {
                return [];
            }

            $values = is_array($raw) ? $raw : explode(',', (string) $raw);

            return array_values(array_filter(array_map('trim', $values)));
        };

        return [
            'q' => $request->string('q')->trim()->value() ?: null,
            'country' => array_map('strtoupper', $list('country')),
            'level' => array_values(array_intersect($list('level'), DegreeLevel::values())),
            'major' => $list('major'),
            'funding' => array_values(array_intersect($list('funding'), FundingType::values())),
            'language' => array_values(array_intersect($list('language'), LanguageRequirement::values())),
            'sort' => $request->string('sort')->value() ?: 'newest',
        ];
    }

    /** @param  array<string, mixed>  $filters */
    public function apply(Builder $query, array $filters): Builder
    {
        if ($filters['q']) {
            $term = $filters['q'];

            $query->where(function (Builder $q) use ($term): void {
                $q->whereLike('title_ar', $term)
                    ->orWhereLike('title_en', $term)
                    ->orWhereLike('provider', $term)
                    ->orWhereLike('university_name', $term)
                    ->orWhereLike('country_name_ar', $term)
                    ->orWhereHas('majors', fn (Builder $m) => $m->whereRaw(
                        'LOWER(name) LIKE ?', ['%'.mb_strtolower($term).'%'],
                    ));
            });
        }

        if ($filters['country']) {
            $query->whereIn('country_code', $filters['country']);
        }

        if ($filters['level']) {
            $query->whereHas('levels', fn (Builder $q) => $q->whereIn('level', $filters['level']));
        }

        if ($filters['major']) {
            $query->whereHas('majors', fn (Builder $q) => $q->whereIn('name', $filters['major']));
        }

        if ($filters['funding']) {
            $query->whereIn('funding_type', $filters['funding']);
        }

        if ($filters['language']) {
            $query->whereIn('language_requirement', $filters['language']);
        }

        return $this->sort($query, $filters['sort']);
    }

    private function sort(Builder $query, string $sort): Builder
    {
        return match ($sort) {
            'deadline' => $query->orderBy('deadline'),
            'title' => $query->orderBy('title_ar'),
            // الترتيب حسب المطابقة يتم بعد الجلب لأنه يعتمد على ملف المستخدم
            'match' => $query->orderByDesc('is_featured')->latest(),
            default => $query->latest(),
        };
    }

    /**
     * عدّادات الفلاتر (الدول والتخصصات) لعرضها بجانب الخيارات.
     *
     * @return array{countries: array<int, array<string, mixed>>, majors: array<int, array<string, mixed>>}
     */
    public function facets(): array
    {
        $countries = Scholarship::published()
            ->selectRaw('country_code, country_name_ar, count(*) as total')
            ->groupBy('country_code', 'country_name_ar')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'code' => $row->country_code,
                'name' => $row->country_name_ar,
                'count' => (int) $row->total,
            ])
            ->all();

        $majors = ScholarshipMajor::query()
            ->selectRaw('name, count(*) as total')
            ->whereHas('scholarship', fn (Builder $q) => $q->published())
            ->groupBy('name')
            ->orderByDesc('total')
            ->limit(12)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'count' => (int) $row->total])
            ->all();

        return ['countries' => $countries, 'majors' => $majors];
    }
}
