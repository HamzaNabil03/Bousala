<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ScholarshipStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AiToolRun;
use App\Models\CvOrder;
use App\Models\Scholarship;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $pendingReview = Scholarship::where('status', ScholarshipStatus::PendingReview)->count();

        $closingSoon = Scholarship::where('status', ScholarshipStatus::Published)
            ->whereBetween('deadline', [now(), now()->addHours(48)])
            ->count();

        $incomplete = Scholarship::where(fn (Builder $q) => $q
            ->whereNull('description')
            ->orWhereNull('deadline')
            ->orWhere('status', ScholarshipStatus::Draft))
            ->count();

        // لوحة "تحتاج إلى انتباه" — تُعرض العناصر غير الصفرية فقط
        $attention = collect([
            [
                'key' => 'pending_review',
                'count' => $pendingReview,
                'title' => 'منح تحتاج مراجعة واعتماد',
                'note' => 'معلّقة بانتظار قرار النشر',
                'cta' => 'مراجعة',
                'href' => '/admin/scholarships?status=pending_review',
                'tone' => 'warning',
            ],
            [
                'key' => 'closing_soon',
                'count' => $closingSoon,
                'title' => 'منح أقرب موعد للنهاية',
                'note' => 'أقل من 48 ساعة على الإغلاق',
                'cta' => 'عرض المنح',
                'href' => '/admin/scholarships?closing=1',
                'tone' => 'danger',
            ],
            [
                'key' => 'incomplete',
                'count' => $incomplete,
                'title' => 'منح تحتوي على بيانات ناقصة',
                'note' => 'مطلوب استكمال الوصف أو الموعد النهائي',
                'cta' => 'استكمال البيانات',
                'href' => '/admin/scholarships?status=draft',
                'tone' => 'info',
            ],
        ])->filter(fn (array $item) => $item['count'] > 0)->values();

        $totalScholarships = Scholarship::count();
        $published = Scholarship::published()->count();

        return response()->json([
            'data' => [
                'stats' => [
                    'total_scholarships' => $totalScholarships,
                    'published_scholarships' => $published,
                    'published_percent' => $totalScholarships > 0
                        ? round($published / $totalScholarships * 100, 1)
                        : 0,
                    'students' => User::where('role', UserRole::Student)->count(),
                    'needs_review' => $pendingReview + $incomplete,
                    'open_orders' => CvOrder::active()->count(),
                    'ai_runs' => AiToolRun::count(),
                ],
                'attention' => $attention,
            ],
        ]);
    }
}
