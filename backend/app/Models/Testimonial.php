<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Testimonial extends Model
{
    public const PUBLIC_CACHE_KEY = 'public.testimonials.v2';

    protected $fillable = ['student_name', 'student_description', 'feedback_text', 'student_photo_path', 'rating', 'related_service_id', 'display_order', 'is_published', 'published_at', 'consent_confirmed_by', 'consent_confirmed_at'];

    protected function casts(): array
    {
        return ['rating' => 'integer', 'display_order' => 'integer', 'is_published' => 'boolean', 'published_at' => 'datetime', 'consent_confirmed_at' => 'datetime'];
    }

    public function relatedService(): BelongsTo
    {
        return $this->belongsTo(StudentService::class, 'related_service_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true)
            ->where(fn (Builder $builder) => $builder->whereNull('published_at')->orWhere('published_at', '<=', now()))
            ->orderBy('display_order')->orderByDesc('published_at')->orderBy('id');
    }
}
