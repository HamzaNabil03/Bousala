<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AiRunStatus;
use App\Enums\ScholarshipStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AiToolRun;
use App\Models\SavedScholarship;
use App\Models\Scholarship;
use App\Models\ScholarshipMajor;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/** بيانات الرسوم البيانية في صفحة التقارير */
class ReportController extends Controller
{
    private const DAYS = 14;

    public function index(): JsonResponse
    {
        $since = now()->subDays(self::DAYS)->startOfDay();

        $byCountry = Scholarship::published()
            ->selectRaw('country_code, country_name_ar, count(*) as total')
            ->groupBy('country_code', 'country_name_ar')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'code' => $row->country_code,
                'label' => $row->country_name_ar,
                'value' => (int) $row->total,
            ]);

        $byMajor = ScholarshipMajor::selectRaw('name, count(*) as total')
            ->whereHas('scholarship', fn (Builder $q) => $q->published())
            ->groupBy('name')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($row) => ['label' => $row->name, 'value' => (int) $row->total]);

        $statusCounts = Scholarship::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $countFor = fn (ScholarshipStatus $status): int => (int) ($statusCounts[$status->value] ?? 0);

        $topSaved = SavedScholarship::selectRaw('scholarship_id, count(*) as total')
            ->groupBy('scholarship_id')
            ->orderByDesc('total')
            ->limit(5)
            ->with('scholarship:id,title_ar,country_code')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->scholarship?->title_ar ?? '—',
                'country_code' => $row->scholarship?->country_code,
                'value' => (int) $row->total,
            ]);

        $failedRuns = AiToolRun::with(['tool:id,name_ar', 'user:id,name'])
            ->where('status', AiRunStatus::Failed)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (AiToolRun $run) => [
                'tool_name' => $run->tool->name_ar,
                'user_name' => $run->user?->name ?? '—',
                'error_message' => $run->error_message,
                'created_at' => $run->created_at,
            ]);

        return response()->json([
            'data' => [
                'kpis' => [
                    'published_scholarships' => Scholarship::published()->count(),
                    'students' => User::where('role', UserRole::Student)->count(),
                    'saves' => SavedScholarship::count(),
                    'ai_runs' => AiToolRun::count(),
                ],
                'by_country' => $byCountry,
                'by_major' => $byMajor,
                'status_distribution' => [
                    ['key' => 'published', 'label' => ScholarshipStatus::Published->label(), 'value' => $countFor(ScholarshipStatus::Published)],
                    ['key' => 'pending', 'label' => ScholarshipStatus::PendingReview->label(), 'value' => $countFor(ScholarshipStatus::PendingReview)],
                    ['key' => 'draft', 'label' => ScholarshipStatus::Draft->label(), 'value' => $countFor(ScholarshipStatus::Draft)],
                    ['key' => 'expired', 'label' => ScholarshipStatus::Expired->label(), 'value' => $countFor(ScholarshipStatus::Expired) + $countFor(ScholarshipStatus::Archived)],
                ],
                'ai_runs_trend' => $this->dailySeries(
                    AiToolRun::where('created_at', '>=', $since)->pluck('created_at'),
                ),
                'signups_trend' => $this->dailySeries(
                    User::where('created_at', '>=', $since)->pluck('created_at'),
                ),
                'top_saved' => $topSaved,
                'failed_runs' => $failedRuns,
                'days' => self::DAYS,
            ],
        ]);
    }

    /**
     * يبني سلسلة الأيام الأخيرة (الأقدم أولاً) مع عدّاد كل يوم.
     *
     * @param  Collection<int, Carbon>  $timestamps
     * @return array<int, array{label:string, value:int}>
     */
    private function dailySeries(Collection $timestamps): array
    {
        $buckets = [];

        for ($i = self::DAYS - 1; $i >= 0; $i--) {
            $buckets[now()->subDays($i)->toDateString()] = 0;
        }

        foreach ($timestamps as $timestamp) {
            $key = $timestamp->toDateString();

            if (array_key_exists($key, $buckets)) {
                $buckets[$key]++;
            }
        }

        return collect($buckets)
            ->map(fn (int $value, string $date) => [
                'label' => now()->parse($date)->format('j/n'),
                'value' => $value,
            ])
            ->values()
            ->all();
    }
}
