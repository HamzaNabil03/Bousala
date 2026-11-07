<?php

namespace App\Models;

use App\Enums\Gender;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentProfile extends Model
{
    protected $fillable = [
        'user_id',
        'full_name_ar',
        'full_name_en',
        'birth_date',
        'nationality',
        'gender',
        'country',
        'city',
        'linkedin_url',
        'portfolio_url',
        'academic_email',
        'bio',
        'headline',
        'completion_percent',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'gender' => Gender::class,
            'completion_percent' => 'integer',
        ];
    }

    /** العلاقات التي تحتاجها المطابقة وأدوات الذكاء الاصطناعي دفعةً واحدة */
    public const FULL_RELATIONS = [
        'educations',
        'experiences',
        'skills',
        'languages',
        'certifications',
        'projects',
        'interests',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function educations(): HasMany
    {
        return $this->hasMany(Education::class)->orderBy('sort_order');
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(Experience::class)->orderBy('sort_order');
    }

    public function skills(): HasMany
    {
        return $this->hasMany(ProfileSkill::class)->orderBy('name');
    }

    public function languages(): HasMany
    {
        return $this->hasMany(ProfileLanguage::class)->orderBy('name');
    }

    public function certifications(): HasMany
    {
        return $this->hasMany(Certification::class)->orderByDesc('issue_date');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class)->orderByDesc('year');
    }

    public function interests(): HasMany
    {
        return $this->hasMany(Interest::class)->orderBy('name');
    }

    /** أحدث مؤهل دراسي — أساس حساب المستوى التالي في المطابقة */
    public function latestEducation(): ?Education
    {
        return $this->educations->sortByDesc(fn (Education $e) => $e->graduation_year ?? 0)->first();
    }
}
