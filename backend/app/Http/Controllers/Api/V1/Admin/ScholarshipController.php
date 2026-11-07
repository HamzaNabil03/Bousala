<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ScholarshipStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ScholarshipRequest;
use App\Http\Resources\ScholarshipResource;
use App\Models\Scholarship;
use App\Services\AuditService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ScholarshipController extends Controller
{
    private const RELATIONS = ['levels', 'majors', 'eligibility', 'documents', 'benefits'];

    public function __construct(private readonly AuditService $audit) {}

    /** جدول المنح بكل الحالات مع الفلاتر والإحصائيات */
    public function index(Request $request): JsonResponse
    {
        $query = Scholarship::with('levels');

        if ($search = $request->string('q')->trim()->value()) {
            $query->where(fn (Builder $q) => $q
                ->whereLike('title_ar', $search)
                ->orWhereLike('title_en', $search)
                ->orWhereLike('provider', $search));
        }

        if ($status = $request->string('status')->value()) {
            $query->where('status', $status);
        }

        if ($country = $request->string('country')->value()) {
            $query->where('country_code', strtoupper($country));
        }

        // المنح التي تغلق خلال 48 ساعة
        if ($request->boolean('closing')) {
            $query->where('status', ScholarshipStatus::Published)
                ->whereBetween('deadline', [now(), now()->addHours(48)]);
        }

        $page = $query->latest()->paginate(config('menhity.pagination.admin'))->withQueryString();

        $counts = Scholarship::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'data' => ScholarshipResource::collection($page)->resolve(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'stats' => [
                    'total' => (int) $counts->sum(),
                    'published' => (int) ($counts[ScholarshipStatus::Published->value] ?? 0),
                    'draft' => (int) ($counts[ScholarshipStatus::Draft->value] ?? 0),
                    'pending_review' => (int) ($counts[ScholarshipStatus::PendingReview->value] ?? 0),
                    'expired' => (int) ($counts[ScholarshipStatus::Expired->value] ?? 0),
                ],
            ],
        ]);
    }

    public function show(Scholarship $scholarship): ScholarshipResource
    {
        return new ScholarshipResource($scholarship->load(self::RELATIONS));
    }

    public function store(ScholarshipRequest $request): JsonResponse
    {
        $scholarship = DB::transaction(function () use ($request): Scholarship {
            $data = $request->validated();

            $scholarship = Scholarship::create([
                ...$this->scalars($data),
                'slug' => Scholarship::generateSlug($data['title_en'] ?? $data['title_ar']),
                'created_by_id' => $request->user()->id,
            ]);

            $this->syncChildren($scholarship, $data);

            return $scholarship;
        });

        $this->audit->log($request->user(), 'scholarship.create', 'Scholarship', $scholarship->id, [
            'title_ar' => $scholarship->title_ar,
        ]);

        return response()->json([
            'message' => 'تم إنشاء المنحة.',
            'data' => (new ScholarshipResource($scholarship->load(self::RELATIONS)))->resolve(),
        ], 201);
    }

    public function update(ScholarshipRequest $request, Scholarship $scholarship): JsonResponse
    {
        DB::transaction(function () use ($request, $scholarship): void {
            $data = $request->validated();

            $scholarship->update($this->scalars($data, $scholarship));
            $this->syncChildren($scholarship, $data);
        });

        $this->audit->log($request->user(), 'scholarship.update', 'Scholarship', $scholarship->id, [
            'title_ar' => $scholarship->title_ar,
        ]);

        return response()->json([
            'message' => 'تم حفظ التعديلات.',
            'data' => (new ScholarshipResource($scholarship->fresh(self::RELATIONS)))->resolve(),
        ]);
    }

    /** تغيير حالة النشر بسرعة من الجدول */
    public function setStatus(Request $request, Scholarship $scholarship): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(ScholarshipStatus::class)],
        ]);

        $status = ScholarshipStatus::from($validated['status']);

        $scholarship->update([
            'status' => $status,
            'published_at' => $status === ScholarshipStatus::Published
                ? ($scholarship->published_at ?? now())
                : $scholarship->published_at,
        ]);

        $this->audit->log($request->user(), 'scholarship.status', 'Scholarship', $scholarship->id, [
            'status' => $status->value,
        ]);

        return response()->json(['message' => "تم تغيير الحالة إلى: {$status->label()}"]);
    }

    /** الحذف النهائي — لمدير النظام فقط */
    public function destroy(Request $request, Scholarship $scholarship): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'الحذف متاح لمدير النظام فقط.');

        $id = $scholarship->id;
        $scholarship->delete();

        $this->audit->log($request->user(), 'scholarship.delete', 'Scholarship', $id);

        return response()->json(['message' => 'تم حذف المنحة نهائياً.']);
    }

    /**
     * الحقول المباشرة على جدول المنح.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function scalars(array $data, ?Scholarship $existing = null): array
    {
        $status = ScholarshipStatus::from($data['status']);

        return [
            ...collect($data)->except([
                'levels', 'majors', 'eligibility', 'documents', 'benefits',
            ])->all(),
            'published_at' => $status === ScholarshipStatus::Published
                ? ($existing?->published_at ?? now())
                : $existing?->published_at,
        ];
    }

    /**
     * تُستبدل العناصر الفرعية بالكامل — أبسط وأدقّ من محاولة المطابقة.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncChildren(Scholarship $scholarship, array $data): void
    {
        $scholarship->levels()->delete();
        $scholarship->majors()->delete();
        $scholarship->eligibility()->delete();
        $scholarship->documents()->delete();
        $scholarship->benefits()->delete();

        foreach ($data['levels'] as $level) {
            $scholarship->levels()->create(['level' => $level]);
        }

        foreach ($data['majors'] ?? [] as $name) {
            $scholarship->majors()->create(['name' => $name]);
        }

        foreach ($data['eligibility'] ?? [] as $index => $text) {
            $scholarship->eligibility()->create(['text' => $text, 'sort_order' => $index]);
        }

        foreach ($data['documents'] ?? [] as $index => $document) {
            $scholarship->documents()->create([...$document, 'sort_order' => $index]);
        }

        foreach ($data['benefits'] ?? [] as $index => $benefit) {
            $scholarship->benefits()->create([...$benefit, 'sort_order' => $index]);
        }
    }
}
