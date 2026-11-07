<?php

namespace App\Models;

use App\Enums\FundingType;
use App\Enums\LanguageRequirement;
use App\Enums\ScholarshipStatus;
use Database\Factories\ScholarshipFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Scholarship extends Model
{
    /** @use HasFactory<ScholarshipFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'title_ar',
        'title_en',
        'provider',
        'university_name',
        'country_code',
        'country_name_ar',
        'region',
        'funding_type',
        'language_requirement',
        'status',
        'description',
        'apply_url',
        'cover_image_url',
        'logo_url',
        'open_date',
        'deadline',
        'min_gpa',
        'gpa_scale',
        'acceptance_rate',
        'is_featured',
        'platform_application_enabled',
        'platform_application_requests_enabled',
        'platform_application_price',
        'platform_application_currency',
        'platform_application_description',
        'platform_application_documents',
        'created_by_id',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'funding_type' => FundingType::class,
            'language_requirement' => LanguageRequirement::class,
            'status' => ScholarshipStatus::class,
            'open_date' => 'date',
            'deadline' => 'date',
            'published_at' => 'datetime',
            'min_gpa' => 'float',
            'gpa_scale' => 'float',
            'acceptance_rate' => 'float',
            'is_featured' => 'boolean',
            'platform_application_enabled' => 'boolean',
            'platform_application_requests_enabled' => 'boolean',
            'platform_application_price' => 'decimal:2',
            'platform_application_documents' => 'array',
            'views_count' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /* ---------------- العلاقات ---------------- */

    public function levels(): HasMany
    {
        return $this->hasMany(ScholarshipLevel::class);
    }

    public function majors(): HasMany
    {
        return $this->hasMany(ScholarshipMajor::class);
    }

    public function eligibility(): HasMany
    {
        return $this->hasMany(ScholarshipEligibility::class)->orderBy('sort_order');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ScholarshipDocument::class)->orderBy('sort_order');
    }

    public function benefits(): HasMany
    {
        return $this->hasMany(ScholarshipBenefit::class)->orderBy('sort_order');
    }

    public function savedBy(): HasMany
    {
        return $this->hasMany(SavedScholarship::class);
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /* ---------------- النطاقات ---------------- */

    /**
     * بحث نصّي غير حسّاس لحالة الأحرف يعمل على PostgreSQL و MySQL و SQLite معاً
     * (ilike خاصة بـ PostgreSQL وحدها).
     */
    public function scopeWhereLike(Builder $query, string $column, string $term): Builder
    {
        return $query->whereRaw('LOWER('.$query->getGrammar()->wrap($column).') LIKE ?', [
            '%'.mb_strtolower($term).'%',
        ]);
    }

    public function scopeOrWhereLike(Builder $query, string $column, string $term): Builder
    {
        return $query->orWhereRaw('LOWER('.$query->getGrammar()->wrap($column).') LIKE ?', [
            '%'.mb_strtolower($term).'%',
        ]);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ScholarshipStatus::Published);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->published()->whereDate('deadline', '>=', now());
    }

    /* ---------------- مساعدات ---------------- */

    /** عدد الأيام حتى الموعد النهائي (سالب = انقضى) */
    public function daysUntilDeadline(): ?int
    {
        return $this->deadline
            ? (int) round(now()->startOfDay()->diffInDays($this->deadline->startOfDay(), false))
            : null;
    }

    /** درجة إلحاح الموعد — تتحكّم بلون البادج وشكل الزر في الواجهة */
    public function deadlineUrgency(): string
    {
        $days = $this->daysUntilDeadline();

        return match (true) {
            $days === null => 'normal',
            $days < 0 => 'passed',
            $days <= 14 => 'urgent',
            $days <= 45 => 'soon',
            default => 'normal',
        };
    }

    public function minGpaPercent(): ?float
    {
        if ($this->min_gpa === null || ! $this->gpa_scale) {
            return null;
        }

        return max(0, min(100, ($this->min_gpa / $this->gpa_scale) * 100));
    }

    /**
     * يولّد slug فريداً. تُزال العلامات اللاتينية (Türkiye ← turkiye)
     * وتبقى الحروف العربية عندما لا يوجد بديل لاتيني.
     */
    public static function generateSlug(string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source);

        if ($base === '') {
            $base = trim(preg_replace('/[^\p{L}\p{N}]+/u', '-', mb_strtolower($source)), '-');
        }

        if ($base === '') {
            $base = 'scholarship-'.Str::random(6);
        }

        $slug = $base;
        $suffix = 1;

        while (static::where('slug', $slug)
            ->when($ignoreId, fn (Builder $q) => $q->whereKeyNot($ignoreId))
            ->exists()
        ) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}
