<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AiRunStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AiToolResource;
use App\Models\AiTool;
use App\Models\AiToolRun;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiToolController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(): JsonResponse
    {
        $monthStart = now()->startOfMonth();

        $tools = AiTool::orderBy('sort_order')
            ->withCount(['runs as month_runs_count' => fn ($q) => $q->where('created_at', '>=', $monthStart)])
            ->get();

        $totalRuns = AiToolRun::count();
        $successRuns = AiToolRun::where('status', AiRunStatus::Success)->count();

        $recent = AiToolRun::with(['tool:id,name_ar,icon', 'user:id,name'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (AiToolRun $run) => [
                'id' => $run->id,
                'tool_name' => $run->tool->name_ar,
                'tool_icon' => $run->tool->icon,
                'user_name' => $run->user?->name ?? 'مستخدم محذوف',
                'status' => $run->status->value,
                'status_label' => $run->status->label(),
                'duration_ms' => $run->duration_ms,
                'error_message' => $run->error_message,
                'created_at' => $run->created_at,
            ]);

        $mostUsed = $tools->sortByDesc('month_runs_count')->first();

        return response()->json([
            'data' => [
                'tools' => $tools->map(fn (AiTool $tool) => [
                    ...(new AiToolResource($tool))->resolve(),
                    'month_runs_count' => $tool->month_runs_count,
                ])->all(),
                'recent_runs' => $recent,
            ],
            'meta' => [
                'total_runs' => $totalRuns,
                'month_runs' => AiToolRun::where('created_at', '>=', $monthStart)->count(),
                'beneficiaries' => AiToolRun::whereNotNull('user_id')->distinct('user_id')->count('user_id'),
                'active_tools' => $tools->where('is_active', true)->count(),
                'total_tools' => $tools->count(),
                'success_rate' => $totalRuns > 0 ? round($successRuns / $totalRuns * 100, 1) : 100,
                'most_used' => $mostUsed?->name_ar,
                'most_used_count' => $mostUsed?->month_runs_count ?? 0,
            ],
        ]);
    }

    /** تفعيل الأداة أو تعطيلها في واجهة الطلاب */
    public function toggle(Request $request, AiTool $aiTool): JsonResponse
    {
        $aiTool->update(['is_active' => ! $aiTool->is_active]);

        $this->audit->log($request->user(), 'ai_tool.toggle', 'AiTool', $aiTool->id, [
            'is_active' => $aiTool->is_active,
        ]);

        return response()->json([
            'message' => $aiTool->is_active ? 'تم تفعيل الأداة.' : 'تم تعطيل الأداة.',
            'is_active' => $aiTool->is_active,
        ]);
    }
}
