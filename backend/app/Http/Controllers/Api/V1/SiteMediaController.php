<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SettingsService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SiteMediaController extends Controller
{
    public function __construct(private readonly SettingsService $settings) {}

    public function show(string $slot): StreamedResponse
    {
        validator(['slot' => $slot], [
            'slot' => ['required', Rule::in(array_keys(SettingsService::DEFAULT_MEDIA))],
        ])->validate();

        $item = $this->settings->media()[$slot] ?? [];
        $path = $item['path'] ?? null;

        abort_unless($path && Storage::disk('site_media')->exists($path), 404);

        return Storage::disk('site_media')->response($path, null, [
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
