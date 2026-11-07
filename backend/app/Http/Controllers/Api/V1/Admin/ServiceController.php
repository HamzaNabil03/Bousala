<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentServiceResource;
use App\Models\ServiceCategory;
use App\Models\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => StudentServiceResource::collection(StudentService::with(['category', 'fields'])->withCount('requests')->orderBy('sort_order')->get())->resolve(),
            'categories' => ServiceCategory::orderBy('sort_order')->get(),
        ]);
    }

    public function show(StudentService $service): StudentServiceResource
    {
        return new StudentServiceResource($service->load(['category', 'fields'])->loadCount('requests'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $service = DB::transaction(function () use ($request, $data): StudentService {
            $service = StudentService::create([...$this->scalars($data), 'slug' => $this->uniqueSlug($data['name'])]);
            $this->syncFields($service, $data['fields'] ?? []);
            $this->storeImage($request, $service);
            return $service;
        });
        return response()->json(['message' => 'تم إنشاء الخدمة.', 'data' => (new StudentServiceResource($service->load(['category', 'fields'])))->resolve()], 201);
    }

    public function update(Request $request, StudentService $service): JsonResponse
    {
        $data = $this->validated($request, $service);
        DB::transaction(function () use ($request, $service, $data): void {
            $service->update($this->scalars($data));
            if (array_key_exists('fields', $data)) $this->syncFields($service, $data['fields']);
            $this->storeImage($request, $service);
        });
        return response()->json(['message' => 'تم حفظ الخدمة.', 'data' => (new StudentServiceResource($service->fresh()->load(['category', 'fields'])->loadCount('requests')))->resolve()]);
    }

    public function destroy(StudentService $service): JsonResponse
    {
        if ($service->requests()->exists() || $service->system_key) {
            $service->update(['is_active' => false]);
            return response()->json(['message' => 'تم تعطيل الخدمة للحفاظ على الطلبات السابقة.']);
        }
        if ($service->image_path) Storage::disk('public')->delete($service->image_path);
        $service->delete();
        return response()->json(['message' => 'تم حذف الخدمة.']);
    }

    public function toggle(StudentService $service): JsonResponse
    {
        $service->update(['is_active' => ! $service->is_active]);
        return response()->json(['message' => $service->is_active ? 'تم تفعيل الخدمة.' : 'تم تعطيل الخدمة.', 'data' => ['is_active' => $service->is_active]]);
    }

    private function validated(Request $request, ?StudentService $service = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:180'], 'description' => ['required', 'string', 'max:4000'],
            'category_id' => ['nullable', 'exists:service_categories,id'], 'price' => ['required', 'numeric', 'min:0', 'max:999999'],
            'currency' => ['required', 'string', 'max:8'], 'icon' => ['nullable', 'string', 'max:60'],
            'delivery_days' => ['nullable', 'integer', 'min:1', 'max:365'], 'instructions' => ['nullable', 'string', 'max:3000'],
            'is_active' => ['required', 'boolean'], 'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'fields' => ['sometimes', 'array', 'max:40'], 'fields.*.key' => ['required', 'regex:/^[a-z][a-z0-9_]*$/', 'max:60'],
            'fields.*.label' => ['required', 'string', 'max:180'], 'fields.*.type' => ['required', Rule::in(['text', 'textarea', 'email', 'phone', 'select', 'file', 'date'])],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'], 'fields.*.options' => ['nullable', 'array'],
            'fields.*.options.*' => ['string', 'max:160'], 'fields.*.is_required' => ['required', 'boolean'],
            'fields.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function scalars(array $data): array
    {
        return collect($data)->except(['fields', 'image'])->merge(['icon' => $data['icon'] ?? 'FileText'])->all();
    }

    private function syncFields(StudentService $service, array $fields): void
    {
        $keys = collect($fields)->pluck('key');
        $service->fields()->whereNotIn('key', $keys)->delete();
        foreach ($fields as $index => $field) $service->fields()->updateOrCreate(['key' => $field['key']], [...$field, 'sort_order' => $field['sort_order'] ?? $index]);
    }

    private function storeImage(Request $request, StudentService $service): void
    {
        if (! $request->hasFile('image')) return;
        if ($service->image_path) Storage::disk('public')->delete($service->image_path);
        $service->update(['image_path' => $request->file('image')->store('service-icons', 'public')]);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'service-'.Str::lower(Str::random(6)); $slug = $base; $i = 1;
        while (StudentService::where('slug', $slug)->exists()) $slug = $base.'-'.(++$i);
        return $slug;
    }
}
