<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\ScholarshipListResource;
use App\Models\SavedScholarship;
use App\Models\Scholarship;
use App\Services\MatchingService;
use App\Services\ProfileCompletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** كل ما تحتاجه شاشة "نظرة عامة" في طلب واحد */
class DashboardController extends Controller
{
    public function __construct(
        private readonly MatchingService $matching,
        private readonly ProfileCompletionService $completion,
        private readonly ProfileController $profiles,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $this->profiles->profileFor($user);

        $openScholarships = Scholarship::open()
            ->with(['levels', 'majors'])
            ->orderBy('deadline')
            ->limit(40)
            ->get();

        $savedIds = SavedScholarship::where('user_id', $user->id)
            ->pluck('scholarship_id')
            ->flip();

        $matches = $this->matching->rank($profile, $openScholarships)
            ->filter(fn (array $row) => $row['score'] > 0)
            ->take(3)
            ->map(function (array $row) use ($savedIds) {
                $scholarship = $row['scholarship'];
                $scholarship->match_score = $row['score'];
                $scholarship->match_reasons = $row['reasons'];
                $scholarship->is_saved = $savedIds->has($scholarship->id);

                return $scholarship;
            })
            ->values();

        $upcoming = $openScholarships->take(3)->values();

        return response()->json([
            'data' => [
                'completion' => $this->completion->evaluate($profile),
                'matches' => ScholarshipListResource::collection($matches)->resolve(),
                'upcoming_deadlines' => ScholarshipListResource::collection($upcoming)->resolve(),
                'documents' => DocumentResource::collection(
                    $user->documents()->latest()->limit(3)->get(),
                )->resolve(),
                'stats' => [
                    'saved' => $savedIds->count(),
                    'documents' => $user->documents()->count(),
                    'unread_notifications' => $user->notifications()->unread()->count(),
                ],
            ],
        ]);
    }
}
