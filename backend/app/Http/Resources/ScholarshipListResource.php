<?php

namespace App\Http\Resources;

use App\Models\Scholarship;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تمثيل مختصر للمنحة — يُستخدم في البطاقات والقوائم.
 *
 * @mixin Scholarship
 */
class ScholarshipListResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'provider' => $this->provider,
            'country_code' => $this->country_code,
            'country_name_ar' => $this->country_name_ar,
            'region' => $this->region,
            'funding_type' => $this->funding_type->value,
            'funding_label' => $this->funding_type->label(),
            'language_requirement' => $this->language_requirement->value,
            'language_label' => $this->language_requirement->label(),
            'status' => $this->status->value,
            'deadline' => $this->deadline?->toDateString(),
            'days_until_deadline' => $this->daysUntilDeadline(),
            'deadline_urgency' => $this->deadlineUrgency(),
            'is_featured' => $this->is_featured,
            'levels' => $this->whenLoaded(
                'levels',
                fn () => $this->levels->map(fn ($l) => [
                    'value' => $l->level->value,
                    'label' => $l->level->label(),
                ])->all(),
            ),
            // تُضاف من الكنترولر عند حساب المطابقة أو حالة الحفظ
            'match_score' => $this->when(isset($this->match_score), fn () => $this->match_score),
            'match_reasons' => $this->when(isset($this->match_reasons), fn () => $this->match_reasons),
            'is_saved' => $this->when(isset($this->is_saved), fn () => (bool) $this->is_saved),
        ];
    }
}
