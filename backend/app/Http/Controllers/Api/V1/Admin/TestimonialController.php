<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TestimonialResource;
use App\Models\StudentService;
use App\Models\Testimonial;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class TestimonialController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(): JsonResponse
    {
        $items = Testimonial::with('relatedService')->orderBy('display_order')->orderBy('id')->get();
        return response()->json([
            'data' => TestimonialResource::collection($items)->resolve(),
            'services' => StudentService::orderBy('sort_order')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $this->ensureConsentBeforePublishing($request);
        $testimonial = Testimonial::create(collect($data)->except(['photo', 'remove_photo', 'consent_confirmed'])->all());
        $this->recordConsent($request, $testimonial);
        $this->syncPhoto($request, $testimonial);
        $this->afterWrite($request, 'testimonial.created', $testimonial);
        return response()->json(['message' => 'تمت إضافة رأي الطالب.', 'data' => (new TestimonialResource($testimonial->fresh()->load('relatedService')))->resolve()], 201);
    }

    public function update(Request $request, Testimonial $testimonial): JsonResponse
    {
        $data = $this->validated($request);
        $this->ensureConsentBeforePublishing($request, $testimonial);
        $testimonial->update(collect($data)->except(['photo', 'remove_photo', 'consent_confirmed'])->all());
        $this->recordConsent($request, $testimonial);
        $this->syncPhoto($request, $testimonial);
        $this->afterWrite($request, 'testimonial.updated', $testimonial);
        return response()->json(['message' => 'تم حفظ رأي الطالب.', 'data' => (new TestimonialResource($testimonial->fresh()->load('relatedService')))->resolve()]);
    }

    public function destroy(Request $request, Testimonial $testimonial): JsonResponse
    {
        $id = $testimonial->id;
        $this->deletePhoto($testimonial);
        $testimonial->delete();
        Cache::forget(Testimonial::PUBLIC_CACHE_KEY);
        $this->audit->log($request->user(), 'testimonial.deleted', Testimonial::class, $id);
        return response()->json(['message' => 'تم حذف رأي الطالب.']);
    }

    public function photo(Testimonial $testimonial): StreamedResponse
    {
        abort_unless($testimonial->student_photo_path && Storage::disk('site_media')->exists($testimonial->student_photo_path), 404);
        return Storage::disk('site_media')->response($testimonial->student_photo_path, null, ['Cache-Control' => 'private, max-age=300', 'X-Content-Type-Options' => 'nosniff']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'student_name' => ['required', 'string', 'min:2', 'max:160'],
            'student_description' => ['nullable', 'string', 'max:180'],
            'feedback_text' => ['required', 'string', 'min:10', 'max:3000'],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'related_service_id' => ['nullable', 'exists:student_services,id'],
            'display_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'is_published' => ['required', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:min_width=200,min_height=200'],
            'remove_photo' => ['sometimes', 'boolean'],
            'consent_confirmed' => ['sometimes', 'boolean'],
        ]);
    }

    private function ensureConsentBeforePublishing(Request $request, ?Testimonial $testimonial = null): void
    {
        if (! $request->boolean('is_published')) return;
        if ($request->boolean('consent_confirmed') || $testimonial?->consent_confirmed_at) return;

        throw ValidationException::withMessages([
            'consent_confirmed' => 'يجب تأكيد موافقة الطالب قبل نشر الرأي والبيانات الظاهرة معه.',
        ]);
    }

    private function recordConsent(Request $request, Testimonial $testimonial): void
    {
        if (! $request->boolean('consent_confirmed')) return;

        $testimonial->forceFill([
            'consent_confirmed_by' => $request->user()->getKey(),
            'consent_confirmed_at' => now(),
        ])->save();
    }

    private function syncPhoto(Request $request, Testimonial $testimonial): void
    {
        if ($request->boolean('remove_photo') && ! $request->hasFile('photo')) $this->deletePhoto($testimonial);
        if (! $request->hasFile('photo')) return;
        $this->deletePhoto($testimonial);
        $file = $request->file('photo');
        try {
            $path = $file->storeAs('testimonials', Str::uuid().'.'.strtolower($file->getClientOriginalExtension()), 'site_media');
        } catch (Throwable $exception) {
            report($exception);
            throw ValidationException::withMessages(['photo' => 'تعذّر حفظ الصورة. حاول مجددًا أو اختر صورة أخرى.']);
        }
        if (! $path) throw ValidationException::withMessages(['photo' => 'تعذّر حفظ الصورة. تحقق من مساحة التخزين وحاول مجددًا.']);
        $testimonial->update(['student_photo_path' => $path]);
    }

    private function deletePhoto(Testimonial $testimonial): void
    {
        if ($testimonial->student_photo_path) Storage::disk('site_media')->delete($testimonial->student_photo_path);
        if ($testimonial->exists && $testimonial->student_photo_path) $testimonial->update(['student_photo_path' => null]);
    }

    private function afterWrite(Request $request, string $action, Testimonial $testimonial): void
    {
        Cache::forget(Testimonial::PUBLIC_CACHE_KEY);
        $this->audit->log($request->user(), $action, Testimonial::class, $testimonial->id, [
            'published' => $testimonial->is_published,
            'consent_confirmed_at' => $testimonial->consent_confirmed_at?->toISOString(),
        ]);
    }
}
