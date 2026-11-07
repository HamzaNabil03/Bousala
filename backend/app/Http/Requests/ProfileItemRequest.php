<?php

namespace App\Http\Requests;

use App\Enums\DegreeLevel;
use App\Enums\ExperienceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * تحقّق موحّد لعناصر الملف الأكاديمي (تعليم، خبرات، مهارات…).
 * القواعد تُختار حسب نوع العنصر في المسار.
 */
class ProfileItemRequest extends FormRequest
{
    /** أنواع العناصر المسموح بها ← اسم العلاقة في النموذج */
    public const TYPES = [
        'educations' => 'educations',
        'experiences' => 'experiences',
        'skills' => 'skills',
        'languages' => 'languages',
        'certifications' => 'certifications',
        'projects' => 'projects',
        'interests' => 'interests',
    ];

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return match ($this->route('type')) {
            'educations' => [
                'degree' => ['required', Rule::enum(DegreeLevel::class)],
                'major' => ['nullable', 'string', 'max:160'],
                'institution' => ['required', 'string', 'min:2', 'max:200'],
                'country' => ['nullable', 'string', 'max:80'],
                'graduation_year' => ['nullable', 'integer', 'between:1950,2100'],
                'is_current' => ['sometimes', 'boolean'],
                'gpa_value' => ['nullable', 'numeric', 'between:0,100'],
                'gpa_scale' => ['nullable', 'numeric', Rule::in([4, 5, 100])],
                'honors' => ['nullable', 'string', 'max:120'],
                'thesis_title' => ['nullable', 'string', 'max:1000'],
            ],

            'experiences' => [
                'title' => ['required', 'string', 'min:2', 'max:200'],
                'type' => ['required', Rule::enum(ExperienceType::class)],
                'organization' => ['required', 'string', 'min:2', 'max:200'],
                'country' => ['nullable', 'string', 'max:80'],
                'city' => ['nullable', 'string', 'max:80'],
                'start_date' => ['nullable', 'date'],
                'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
                'is_current' => ['sometimes', 'boolean'],
                'description' => ['nullable', 'string', 'max:3000'],
            ],

            'languages' => [
                'name' => ['required', 'string', 'min:2', 'max:80'],
                'proficiency' => ['required', 'string', 'min:2', 'max:80'],
                'certificate' => ['nullable', 'string', 'max:120'],
            ],

            'certifications' => [
                'title' => ['required', 'string', 'min:2', 'max:200'],
                'issuer' => ['nullable', 'string', 'max:160'],
                'credential_id' => ['nullable', 'string', 'max:120'],
                'issue_date' => ['nullable', 'date'],
                'url' => ['nullable', 'string', 'max:255'],
            ],

            'projects' => [
                'title' => ['required', 'string', 'min:2', 'max:200'],
                'description' => ['nullable', 'string', 'max:3000'],
                'year' => ['nullable', 'integer', 'between:1950,2100'],
                'url' => ['nullable', 'string', 'max:255'],
            ],

            // المهارات والاهتمامات: اسم فقط
            default => [
                'name' => ['required', 'string', 'min:2', 'max:120'],
            ],
        };
    }
}
