<?php

namespace App\Http\Requests\Admin;

use App\Enums\DegreeLevel;
use App\Enums\FundingType;
use App\Enums\LanguageRequirement;
use App\Enums\ScholarshipStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ScholarshipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdminLevel() ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'min:3', 'max:200'],
            'title_en' => ['nullable', 'string', 'max:200'],
            'provider' => ['required', 'string', 'min:2', 'max:200'],
            'university_name' => ['nullable', 'string', 'max:200'],
            'country_code' => ['required', 'string', 'size:2'],
            'country_name_ar' => ['required', 'string', 'min:2', 'max:120'],
            'region' => ['nullable', 'string', 'max:120'],
            'funding_type' => ['required', Rule::enum(FundingType::class)],
            'language_requirement' => ['required', Rule::enum(LanguageRequirement::class)],
            'status' => ['required', Rule::enum(ScholarshipStatus::class)],
            'description' => ['nullable', 'string', 'max:8000'],
            'apply_url' => ['nullable', 'string', 'max:255'],
            'open_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'min_gpa' => ['nullable', 'numeric', 'between:0,100'],
            'gpa_scale' => ['nullable', 'numeric', Rule::in([4, 5, 100])],
            'acceptance_rate' => ['nullable', 'numeric', 'between:0,100'],
            'is_featured' => ['sometimes', 'boolean'],
            'platform_application_enabled' => ['sometimes', 'boolean'],
            'platform_application_requests_enabled' => ['sometimes', 'boolean'],
            'platform_application_price' => ['nullable', 'required_if:platform_application_enabled,true', 'numeric', 'min:0', 'max:999999'],
            'platform_application_currency' => ['nullable', 'required_if:platform_application_enabled,true', 'string', 'max:8'],
            'platform_application_description' => ['nullable', 'string', 'max:3000'],
            'platform_application_documents' => ['sometimes', 'array'],
            'platform_application_documents.*' => ['string', 'max:200'],

            'levels' => ['required', 'array', 'min:1'],
            'levels.*' => [Rule::enum(DegreeLevel::class)],

            'majors' => ['sometimes', 'array'],
            'majors.*' => ['string', 'max:160'],

            'eligibility' => ['sometimes', 'array'],
            'eligibility.*' => ['string', 'max:1000'],

            'documents' => ['sometimes', 'array'],
            'documents.*.name' => ['required', 'string', 'max:200'],
            'documents.*.note' => ['nullable', 'string', 'max:200'],

            'benefits' => ['sometimes', 'array'],
            'benefits.*.title' => ['required', 'string', 'max:200'],
            'benefits.*.description' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'levels.min' => 'اختر مستوى دراسي واحداً على الأقل.',
            'country_code.size' => 'رمز الدولة يتكوّن من حرفين (مثل TR).',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('country_code')) {
            $this->merge(['country_code' => strtoupper((string) $this->input('country_code'))]);
        }
    }
}
