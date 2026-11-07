<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DegreeLevel;
use App\Enums\DocumentKind;
use App\Enums\ExperienceType;
use App\Enums\FundingType;
use App\Enums\LanguageRequirement;
use App\Enums\ScholarshipStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use App\Models\ScholarshipMajor;
use App\Models\User;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

/**
 * بيانات ثابتة تحتاجها الواجهة: معلومات المنصة، ترجمة التعدادات،
 * وإحصائيات الصفحة الرئيسية.
 */
class MetaController extends Controller
{
    public function __construct(private readonly SettingsService $settings) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'site' => $this->settings->publicSite(),
                'enums' => [
                    'degree_levels' => $this->enumOptions(DegreeLevel::cases()),
                    'filterable_degrees' => $this->enumOptions(DegreeLevel::filterable()),
                    'funding_types' => $this->enumOptions(FundingType::cases()),
                    'language_requirements' => $this->enumOptions(LanguageRequirement::cases()),
                    'experience_types' => $this->enumOptions(ExperienceType::cases()),
                    'document_kinds' => $this->enumOptions(DocumentKind::cases()),
                    'scholarship_statuses' => $this->enumOptions(ScholarshipStatus::cases()),
                    'user_roles' => $this->enumOptions(UserRole::cases()),
                    'user_statuses' => $this->enumOptions(UserStatus::cases()),
                ],
                'uploads' => config('menhity.uploads'),
            ],
        ]);
    }

    /** إحصائيات شريط الصفحة الرئيسية */
    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'scholarships' => Scholarship::published()->count(),
                'countries' => Scholarship::published()->distinct('country_code')->count('country_code'),
                'majors' => ScholarshipMajor::distinct('name')->count('name'),
                'students' => User::where('role', UserRole::Student)->count(),
            ],
        ]);
    }

    /**
     * @param  array<int, \BackedEnum>  $cases
     * @return array<int, array{value:string, label:string}>
     */
    private function enumOptions(array $cases): array
    {
        return array_map(
            fn ($case) => ['value' => $case->value, 'label' => $case->label()],
            $cases,
        );
    }
}
