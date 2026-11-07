<?php

namespace App\Models;

use App\Enums\DegreeLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Education extends Model
{
    // Laravel يعامل "education" كاسم غير معدود، فنحدّد اسم الجدول صراحةً
    protected $table = 'educations';

    protected $fillable = [
        'student_profile_id',
        'degree',
        'major',
        'institution',
        'country',
        'graduation_year',
        'is_current',
        'gpa_value',
        'gpa_scale',
        'honors',
        'thesis_title',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'degree' => DegreeLevel::class,
            'is_current' => 'boolean',
            'gpa_value' => 'float',
            'gpa_scale' => 'float',
            'graduation_year' => 'integer',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id');
    }

    /** المعدل كنسبة مئوية — لتوحيد المقارنة بين أنظمة 4.0 و5.0 و100 */
    public function gpaPercent(): ?float
    {
        if ($this->gpa_value === null || ! $this->gpa_scale) {
            return null;
        }

        return max(0, min(100, ($this->gpa_value / $this->gpa_scale) * 100));
    }

    /** 3.88 / 4.00  أو  99% */
    public function formattedGpa(): string
    {
        if ($this->gpa_value === null) {
            return '—';
        }

        if (! $this->gpa_scale) {
            return (string) $this->gpa_value;
        }

        if ((int) $this->gpa_scale === 100) {
            return $this->gpa_value.'%';
        }

        return number_format($this->gpa_value, 2).' / '.number_format($this->gpa_scale, 2);
    }
}
