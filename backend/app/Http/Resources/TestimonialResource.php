<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class TestimonialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $photoUrl = null;
        if ($this->student_photo_path) {
            $photoUrl = $request->routeIs('admin.*')
                ? URL::temporarySignedRoute('admin-preview.testimonials.photo', now()->addMinutes(10), ['testimonial' => $this->id, 'v' => $this->updated_at?->timestamp], absolute: false)
                : "/api/v1/testimonials/{$this->id}/photo?v=".$this->updated_at?->timestamp;
        }

        return [
            'id' => $this->id,
            'student_name' => $this->student_name,
            'student_description' => $this->student_description,
            'feedback_text' => $this->feedback_text,
            'rating' => $this->rating,
            'related_service_id' => $this->related_service_id,
            'related_service' => $this->whenLoaded('relatedService', fn () => $this->relatedService ? ['id' => $this->relatedService->id, 'name' => $this->relatedService->name] : null),
            'display_order' => $this->display_order,
            'is_published' => $this->is_published,
            'published_at' => $this->published_at?->toISOString(),
            'consent_confirmed' => filled($this->consent_confirmed_at),
            'consent_confirmed_at' => $this->consent_confirmed_at?->toISOString(),
            'has_photo' => filled($this->student_photo_path),
            'photo_url' => $photoUrl,
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
