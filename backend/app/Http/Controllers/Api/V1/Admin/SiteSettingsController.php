<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SiteSettingsController extends Controller
{
    private const MEDIA_SLOTS = ['hero', 'cta', 'logo', 'favicon'];

    public function __construct(
        private readonly SettingsService $settings,
        private readonly AuditService $audit,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->payload()]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules(), $this->messages());

        $site = $this->settings->put(SettingsService::SITE, $this->nullableValues($validated['site']));
        $social = $this->settings->put(SettingsService::SOCIAL, $this->nullableValues($validated['social'] ?? []));
        $media = $this->storeMedia($request);

        $this->audit->log($request->user(), 'settings.site.update', 'AppSetting', null, [
            'updated_media' => collect(self::MEDIA_SLOTS)->filter(fn (string $slot) => $request->hasFile($slot))->values()->all(),
        ]);

        return response()->json([
            'message' => 'تم حفظ إعدادات الموقع ونشرها.',
            'data' => [
                'site' => $site,
                'social' => $social,
                'media' => $this->settings->media(),
                'public' => $this->settings->publicSite(),
            ],
        ]);
    }

    public function restore(Request $request, string $slot): JsonResponse
    {
        validator(['slot' => $slot], [
            'slot' => ['required', Rule::in(self::MEDIA_SLOTS)],
        ])->validate();

        $stored = $this->settings->get(SettingsService::MEDIA);
        $current = is_array($stored[$slot] ?? null) ? $stored[$slot] : [];
        $currentPath = $current['path'] ?? null;
        $previousPath = $current['previous_path'] ?? null;

        if ($previousPath && Storage::disk('site_media')->exists($previousPath)) {
            $current['path'] = $previousPath;
            $current['previous_path'] = $currentPath;
        } else {
            $current['path'] = null;
            $current['previous_path'] = $currentPath;
        }

        $current['updated_at'] = now()->toIso8601String();
        $stored[$slot] = $current;
        $this->settings->put(SettingsService::MEDIA, $stored);
        $this->audit->log($request->user(), 'settings.site.media.restore', 'AppSetting', null, ['slot' => $slot]);

        return response()->json([
            'message' => 'تمت استعادة الصورة السابقة.',
            'data' => ['media' => $this->settings->media(), 'public' => $this->settings->publicSite()],
        ]);
    }

    /** @return array<string, mixed> */
    private function payload(): array
    {
        return [
            'site' => $this->settings->site(),
            'social' => $this->settings->social(),
            'media' => $this->settings->media(),
        ];
    }

    /** @return array<string, array<int, mixed>> */
    private function rules(): array
    {
        $url = ['nullable', 'url:http,https', 'max:500'];
        $phone = ['nullable', 'string', 'max:30', 'regex:/^[0-9+().\-\s]+$/'];

        return [
            'site' => ['required', 'array'],
            'site.name' => ['required', 'string', 'min:2', 'max:100'],
            'site.name_en' => ['nullable', 'string', 'max:100'],
            'site.tagline' => ['nullable', 'string', 'max:180'],
            'site.description' => ['nullable', 'string', 'max:2000'],
            'site.contact_email' => ['required', 'email:rfc', 'max:255'],
            'site.secondary_email' => ['nullable', 'email:rfc', 'different:site.contact_email', 'max:255'],
            'site.phone' => $phone,
            'site.whatsapp' => $phone,
            'site.address' => ['nullable', 'string', 'max:500'],
            'site.working_hours' => ['nullable', 'string', 'max:500'],
            'site.footer_description' => ['nullable', 'string', 'max:1000'],
            'site.copyright_text' => ['nullable', 'string', 'max:300'],
            'social' => ['sometimes', 'array'],
            'social.facebook' => $url,
            'social.instagram' => $url,
            'social.linkedin' => $url,
            'social.youtube' => $url,
            'social.tiktok' => $url,
            'social.telegram' => $url,
            'social.x' => $url,
            'hero' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192', 'dimensions:min_width=1000,min_height=500'],
            'cta' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192', 'dimensions:min_width=800,min_height=400'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:min_width=64,min_height=64'],
            'favicon' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:min_width=32,min_height=32'],
        ];
    }

    /** @return array<string, string> */
    private function messages(): array
    {
        return [
            'site.name.required' => 'اسم الموقع مطلوب.',
            'site.contact_email.required' => 'بريد التواصل الرئيسي مطلوب.',
            'site.contact_email.email' => 'اكتب بريد تواصل صحيحاً.',
            'site.secondary_email.email' => 'البريد الثانوي غير صحيح.',
            'site.phone.regex' => 'رقم الهاتف يحتوي رموزاً غير مسموحة.',
            'site.whatsapp.regex' => 'رقم واتساب يحتوي رموزاً غير مسموحة.',
            '*.image' => 'يجب اختيار ملف صورة صالح.',
            '*.mimes' => 'الصيغ المسموحة: JPG وPNG وWebP.',
            '*.max' => 'حجم الصورة أكبر من الحد المسموح.',
            '*.dimensions' => 'دقة الصورة أقل من الحد المطلوب لهذا الموضع.',
        ];
    }

    /** @return array<string, mixed> */
    private function storeMedia(Request $request): array
    {
        $stored = $this->settings->get(SettingsService::MEDIA);

        foreach (self::MEDIA_SLOTS as $slot) {
            if (! $request->hasFile($slot)) {
                continue;
            }

            $file = $request->file($slot);
            $current = is_array($stored[$slot] ?? null) ? $stored[$slot] : [];
            $oldPrevious = $current['previous_path'] ?? null;
            if ($oldPrevious) {
                Storage::disk('site_media')->delete($oldPrevious);
            }

            $extension = Str::lower($file->extension() ?: 'jpg');
            $path = $file->storeAs($slot, Str::uuid().'.'.$extension, 'site_media');
            [$width, $height] = getimagesize($file->getRealPath()) ?: [null, null];

            $stored[$slot] = [
                'path' => $path,
                'previous_path' => $current['path'] ?? null,
                'original_name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'width' => $width,
                'height' => $height,
                'updated_at' => now()->toIso8601String(),
            ];
        }

        $this->settings->put(SettingsService::MEDIA, $stored);

        return $this->settings->media();
    }

    /** @param array<string, mixed> $values */
    private function nullableValues(array $values): array
    {
        return array_map(fn ($value) => is_string($value) && trim($value) === '' ? null : (is_string($value) ? trim($value) : $value), $values);
    }
}
