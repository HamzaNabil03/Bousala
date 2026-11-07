<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamMemberResource;
use App\Http\Resources\TestimonialResource;
use App\Models\TeamMember;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ShowcaseController extends Controller
{
    public function team(): JsonResponse
    {
        $items = Cache::remember(
            TeamMember::PUBLIC_CACHE_KEY,
            now()->addMinutes(5),
            fn (): array => TeamMemberResource::collection(TeamMember::visible()->get())->resolve(request()),
        );

        return response()->json(['data' => $items]);
    }

    public function testimonials(): JsonResponse
    {
        $items = Cache::remember(
            Testimonial::PUBLIC_CACHE_KEY,
            now()->addMinutes(5),
            fn (): array => TestimonialResource::collection(Testimonial::published()->with('relatedService')->get())->resolve(request()),
        );

        return response()->json(['data' => $items]);
    }

    public function teamPhoto(TeamMember $teamMember): StreamedResponse
    {
        abort_unless($teamMember->is_visible && $teamMember->photo_path && Storage::disk('site_media')->exists($teamMember->photo_path), 404);
        return Storage::disk('site_media')->response($teamMember->photo_path, null, ['Cache-Control' => 'public, max-age=31536000, immutable', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function testimonialPhoto(Testimonial $testimonial): StreamedResponse
    {
        $isPublic = Testimonial::published()->whereKey($testimonial->getKey())->exists();
        abort_unless($isPublic && $testimonial->student_photo_path && Storage::disk('site_media')->exists($testimonial->student_photo_path), 404);
        return Storage::disk('site_media')->response($testimonial->student_photo_path, null, ['Cache-Control' => 'public, max-age=31536000, immutable', 'X-Content-Type-Options' => 'nosniff']);
    }
}
