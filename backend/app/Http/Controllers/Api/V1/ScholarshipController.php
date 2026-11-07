<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScholarshipListResource;
use App\Http\Resources\ScholarshipResource;
use App\Models\SavedScholarship;
use App\Models\Scholarship;
use App\Models\StudentProfile;
use App\Services\MatchingService;
use App\Services\ScholarshipQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Collection;

class ScholarshipController extends Controller
{
    public function __construct(
        private readonly ScholarshipQueryService $queries,
        private readonly MatchingService $matching,
    ) {}

    /** تصفّح المنح مع البحث والفلاتر والترقيم */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $this->queries->parseFilters($request);

        $query = Scholarship::published()->with(['levels', 'majors']);
        $this->queries->apply($query, $filters);

        $page = $query->paginate(config('menhity.pagination.public'))->withQueryString();

        $this->decorate(collect($page->items()), $request);

        // الترتيب حسب المطابقة يتم على الصفحة الحالية بعد حساب النتائج
        if ($filters['sort'] === 'match') {
            $sorted = collect($page->items())->sortByDesc('match_score')->values()->all();
            $page->setCollection(collect($sorted));
        }

        return ScholarshipListResource::collection($page);
    }

    /** تفاصيل منحة واحدة */
    public function show(Request $request, Scholarship $scholarship): ScholarshipResource
    {
        abort_unless(
            $scholarship->status->value === 'published' || $request->user()?->isAdminLevel(),
            404,
        );

        $scholarship->load(['levels', 'majors', 'eligibility', 'documents', 'benefits']);
        $scholarship->increment('views_count');

        $this->decorate(collect([$scholarship]), $request);

        return new ScholarshipResource($scholarship);
    }

    /** منح مميّزة للصفحة الرئيسية */
    public function featured(Request $request): AnonymousResourceCollection
    {
        $scholarships = Scholarship::published()
            ->with('levels')
            ->orderByDesc('is_featured')
            ->orderBy('deadline')
            ->limit(8)
            ->get();

        return ScholarshipListResource::collection($scholarships);
    }

    /** خيارات الفلاتر مع عدّاد كل خيار */
    public function facets(): JsonResponse
    {
        return response()->json(['data' => $this->queries->facets()]);
    }

    /**
     * يضيف نسبة المطابقة وحالة الحفظ إلى كل منحة في المجموعة.
     *
     * @param  Collection<int, Scholarship>  $scholarships
     */
    private function decorate(Collection $scholarships, Request $request): void
    {
        $user = $request->user();

        if (! $user || $scholarships->isEmpty()) {
            return;
        }

        $savedIds = SavedScholarship::where('user_id', $user->id)
            ->whereIn('scholarship_id', $scholarships->pluck('id'))
            ->pluck('scholarship_id')
            ->flip();

        $profile = StudentProfile::where('user_id', $user->id)
            ->with(['educations', 'skills', 'languages', 'interests'])
            ->first();

        foreach ($scholarships as $scholarship) {
            $scholarship->is_saved = $savedIds->has($scholarship->id);

            if ($profile && $scholarship->relationLoaded('levels') && $scholarship->relationLoaded('majors')) {
                $result = $this->matching->match($profile, $scholarship);
                $scholarship->match_score = $result['score'];
                $scholarship->match_reasons = $result['reasons'];
            }
        }
    }
}
