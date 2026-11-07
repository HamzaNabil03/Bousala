<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScholarshipListResource;
use App\Models\Scholarship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SavedScholarshipController extends Controller
{
    /** المنح المحفوظة للمستخدم الحالي */
    public function index(Request $request): AnonymousResourceCollection
    {
        $scholarships = Scholarship::query()
            ->with('levels')
            ->whereHas('savedBy', fn ($q) => $q->where('user_id', $request->user()->id))
            ->latest()
            ->get()
            ->each(fn (Scholarship $s) => $s->is_saved = true);

        return ScholarshipListResource::collection($scholarships);
    }

    /** حفظ المنحة أو إزالتها من المحفوظات */
    public function toggle(Request $request, Scholarship $scholarship): JsonResponse
    {
        $existing = $request->user()->savedScholarships()
            ->where('scholarship_id', $scholarship->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json(['saved' => false, 'message' => 'تمت الإزالة من المحفوظات.']);
        }

        $request->user()->savedScholarships()->create(['scholarship_id' => $scholarship->id]);

        return response()->json(['saved' => true, 'message' => 'تم حفظ المنحة.']);
    }
}
