<?php

use App\Models\TeamMember;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

function uploadRequest(string $method, string $uri, string $token, array $fields = [], array $files = []): array
{
    $payload = $fields;
    foreach ($files as $key => $path) {
        $payload[$key] = new CURLFile($path, 'image/jpeg', basename($path));
    }
    if ($method !== 'POST') $payload['_method'] = $method;

    $curl = curl_init('http://127.0.0.1:5173'.$uri);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'Authorization: Bearer '.$token],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $content = curl_exec($curl);
    if ($content === false) throw new RuntimeException(curl_error($curl));
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    return [$status, json_decode($content, true) ?? ['raw' => $content]];
}

function getRequest(string $uri, ?string $token = null): array
{
    $curl = curl_init('http://127.0.0.1:5173'.$uri);
    $headers = ['Accept: application/json'];
    if ($token) $headers[] = 'Authorization: Bearer '.$token;
    curl_setopt_array($curl, [CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
    $content = curl_exec($curl);
    if ($content === false) throw new RuntimeException(curl_error($curl));
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    return [$status, json_decode($content, true) ?? ['raw' => $content]];
}

function assertUpload(bool $condition, string $message, array $body = []): void
{
    if (! $condition) throw new RuntimeException($message.' '.json_encode($body, JSON_UNESCAPED_UNICODE));
}

$admin = User::query()->where('role', 'admin')->where('status', 'active')->firstOrFail();
$issuedToken = $admin->createToken('showcase-upload-smoke');
$token = $issuedToken->plainTextToken;
$member = null;
$testimonial = null;
$image = dirname(__DIR__, 3).'/frontend/public/images/landing/cta-1376.jpg';
$suffix = bin2hex(random_bytes(4));

try {
    [$status, $body] = uploadRequest('POST', '/api/v1/admin/team-members', $token, [
        'name' => "Upload Member {$suffix}",
        'role' => 'Developer',
        'display_order' => '9998',
        'is_visible' => '1',
    ], ['photo' => $image]);
    assertUpload($status === 201, 'Team image upload failed.', $body);
    $member = TeamMember::findOrFail($body['data']['id']);
    assertUpload($member->photo_path && Storage::disk('site_media')->exists($member->photo_path), 'Team image was not persisted.', $body);
    [$photoStatus] = getRequest("/api/v1/team-members/{$member->id}/photo");
    assertUpload($photoStatus === 200, 'Public team image route failed.');
    [, $adminTeamBody] = getRequest('/api/v1/admin/team-members', $token);
    $adminTeamPhotoUrl = collect($adminTeamBody['data'])->firstWhere('id', $member->id)['photo_url'] ?? null;
    assertUpload(is_string($adminTeamPhotoUrl) && str_contains($adminTeamPhotoUrl, 'signature='), 'Admin team image URL is not signed.', $adminTeamBody);
    [$adminPhotoStatus] = getRequest($adminTeamPhotoUrl);
    assertUpload($adminPhotoStatus === 200, 'Signed admin team image route failed.');

    [$status, $body] = uploadRequest('POST', '/api/v1/admin/testimonials', $token, [
        'student_name' => "Upload Student {$suffix}",
        'feedback_text' => 'This upload verification testimonial is removed automatically after the test.',
        'display_order' => '9998',
        'is_published' => '1',
        'consent_confirmed' => '1',
    ], ['photo' => $image]);
    assertUpload($status === 201, 'Testimonial image upload failed.', $body);
    $testimonial = Testimonial::findOrFail($body['data']['id']);
    assertUpload($testimonial->student_photo_path && Storage::disk('site_media')->exists($testimonial->student_photo_path), 'Testimonial image was not persisted.', $body);
    [$photoStatus] = getRequest("/api/v1/testimonials/{$testimonial->id}/photo");
    assertUpload($photoStatus === 200, 'Public testimonial image route failed.');
    [, $adminTestimonialBody] = getRequest('/api/v1/admin/testimonials', $token);
    $adminTestimonialPhotoUrl = collect($adminTestimonialBody['data'])->firstWhere('id', $testimonial->id)['photo_url'] ?? null;
    assertUpload(is_string($adminTestimonialPhotoUrl) && str_contains($adminTestimonialPhotoUrl, 'signature='), 'Admin testimonial image URL is not signed.', $adminTestimonialBody);
    [$adminPhotoStatus] = getRequest($adminTestimonialPhotoUrl);
    assertUpload($adminPhotoStatus === 200, 'Signed admin testimonial image route failed.');

    echo "SHOWCASE_UPLOAD_SMOKE=PASS\n";
} finally {
    if ($member) {
        if ($member->photo_path) Storage::disk('site_media')->delete($member->photo_path);
        $member->delete();
    }
    if ($testimonial) {
        if ($testimonial->student_photo_path) Storage::disk('site_media')->delete($testimonial->student_photo_path);
        $testimonial->delete();
    }
    $issuedToken->accessToken->delete();
    Cache::forget(TeamMember::PUBLIC_CACHE_KEY);
    Cache::forget(Testimonial::PUBLIC_CACHE_KEY);
}
