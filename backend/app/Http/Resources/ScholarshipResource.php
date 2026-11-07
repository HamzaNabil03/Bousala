<?php

namespace App\Http\Resources;

use App\Models\Scholarship;
use Illuminate\Http\Request;

/**
 * تمثيل كامل للمنحة — صفحة التفاصيل ونموذج التحرير في لوحة الإدارة.
 *
 * @mixin Scholarship
 */
class ScholarshipResource extends ScholarshipListResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'university_name' => $this->university_name,
            'description' => $this->description,
            'apply_url' => $this->apply_url,
            'open_date' => $this->open_date?->toDateString(),
            'min_gpa' => $this->min_gpa,
            'gpa_scale' => $this->gpa_scale,
            'acceptance_rate' => $this->acceptance_rate,
            'views_count' => $this->views_count,
            'platform_application_enabled' => $this->platform_application_enabled,
            'platform_application_requests_enabled' => $this->platform_application_requests_enabled,
            'platform_application_price' => $this->platform_application_price !== null ? (float) $this->platform_application_price : null,
            'platform_application_currency' => $this->platform_application_currency,
            'platform_application_description' => $this->platform_application_description,
            'platform_application_documents' => $this->platform_application_documents ?? [],
            'majors' => $this->whenLoaded(
                'majors',
                fn () => $this->majors->map(fn ($m) => ['id' => $m->id, 'name' => $m->name])->all(),
            ),
            'eligibility' => $this->whenLoaded(
                'eligibility',
                fn () => $this->eligibility->map(fn ($e) => ['id' => $e->id, 'text' => $e->text])->all(),
            ),
            'documents' => $this->whenLoaded(
                'documents',
                fn () => $this->documents->map(fn ($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                    'note' => $d->note,
                ])->all(),
            ),
            'benefits' => $this->whenLoaded(
                'benefits',
                fn () => $this->benefits->map(fn ($b) => [
                    'id' => $b->id,
                    'title' => $b->title,
                    'description' => $b->description,
                    'icon' => $b->icon,
                ])->all(),
            ),
        ]);
    }
}
