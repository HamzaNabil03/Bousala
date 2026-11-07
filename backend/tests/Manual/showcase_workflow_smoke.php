<?php

use App\Models\TeamMember;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$kernel = $app->make(Kernel::class);

function check(bool $condition, string $message): void
{
    if (! $condition) throw new RuntimeException($message);
}

function callApi(Kernel $kernel, string $method, string $uri, ?string $token = null, array $payload = []): array
{
    $server = ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json'];
    if ($token) $server['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
    $request = Request::create($uri, $method, [], [], [], $server, json_encode($payload));
    $response = $kernel->handle($request);
    $body = json_decode($response->getContent(), true) ?? [];
    $kernel->terminate($request, $response);

    return [$response->getStatusCode(), $body];
}

DB::beginTransaction();

try {
    $admin = User::query()->where('role', 'admin')->where('status', 'active')->first();
    if (! $admin) {
        $admin = User::create([
            'name' => 'Workflow Test Admin',
            'email' => 'workflow-'.uniqid().'@example.test',
            'password' => 'not-used',
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }
    $token = $admin->createToken('showcase-smoke')->plainTextToken;
    $suffix = bin2hex(random_bytes(4));

    [$status, $body] = callApi($kernel, 'POST', '/api/v1/admin/team-members', $token, [
        'name' => "Workflow Member {$suffix}", 'role' => 'Developer', 'display_order' => 9876, 'is_visible' => true,
    ]);
    check($status === 201, 'Team member creation failed: '.json_encode($body));
    $memberId = $body['data']['id'];

    [$status, $body] = callApi($kernel, 'GET', '/api/v1/team-members');
    check($status === 200 && collect($body['data'])->contains('id', $memberId), 'Visible team member did not reach public API.');

    [$status] = callApi($kernel, 'PUT', "/api/v1/admin/team-members/{$memberId}", $token, [
        'name' => "Updated Member {$suffix}", 'role' => 'Lead Developer', 'display_order' => 9876, 'is_visible' => true,
    ]);
    check($status === 200, 'Team member update failed.');
    [, $body] = callApi($kernel, 'GET', '/api/v1/team-members');
    check(collect($body['data'])->firstWhere('id', $memberId)['name'] === "Updated Member {$suffix}", 'Team update was not reflected publicly.');

    [$status] = callApi($kernel, 'PUT', "/api/v1/admin/team-members/{$memberId}", $token, [
        'name' => "Updated Member {$suffix}", 'role' => 'Lead Developer', 'display_order' => 9876, 'is_visible' => false,
    ]);
    check($status === 200, 'Team hide failed.');
    [, $body] = callApi($kernel, 'GET', '/api/v1/team-members');
    check(! collect($body['data'])->contains('id', $memberId), 'Hidden team member is still public.');

    $testimonial = [
        'student_name' => "Student {$suffix}",
        'feedback_text' => 'This is a real workflow verification record that will be rolled back.',
        'display_order' => 9876,
        'is_published' => false,
    ];
    [$status, $body] = callApi($kernel, 'POST', '/api/v1/admin/testimonials', $token, $testimonial);
    check($status === 201, 'Draft testimonial creation failed: '.json_encode($body));
    $testimonialId = $body['data']['id'];

    [$status, $body] = callApi($kernel, 'PUT', "/api/v1/admin/testimonials/{$testimonialId}", $token, [...$testimonial, 'is_published' => true]);
    check($status === 422 && isset($body['errors']['consent_confirmed']), 'Publishing without consent was not rejected.');

    [$status, $body] = callApi($kernel, 'PUT', "/api/v1/admin/testimonials/{$testimonialId}", $token, [...$testimonial, 'is_published' => true, 'consent_confirmed' => true]);
    check($status === 200 && $body['data']['consent_confirmed'] === true, 'Publishing with consent failed.');
    [, $body] = callApi($kernel, 'GET', '/api/v1/testimonials');
    check(collect($body['data'])->contains('id', $testimonialId), 'Published testimonial did not reach public API.');

    $editedText = 'This edited workflow feedback must immediately replace the previous text.';
    [$status] = callApi($kernel, 'PUT', "/api/v1/admin/testimonials/{$testimonialId}", $token, [...$testimonial, 'feedback_text' => $editedText, 'is_published' => true]);
    check($status === 200, 'Editing a consented testimonial failed.');
    [, $body] = callApi($kernel, 'GET', '/api/v1/testimonials');
    check(collect($body['data'])->firstWhere('id', $testimonialId)['feedback_text'] === $editedText, 'Testimonial edit was not reflected publicly.');

    [$status] = callApi($kernel, 'PUT', "/api/v1/admin/testimonials/{$testimonialId}", $token, [...$testimonial, 'feedback_text' => $editedText, 'is_published' => false]);
    check($status === 200, 'Unpublishing testimonial failed.');
    [, $body] = callApi($kernel, 'GET', '/api/v1/testimonials');
    check(! collect($body['data'])->contains('id', $testimonialId), 'Unpublished testimonial is still public.');

    check(is_array(Cache::get(TeamMember::PUBLIC_CACHE_KEY)), 'Team public cache is not a scalar array.');
    check(is_array(Cache::get(Testimonial::PUBLIC_CACHE_KEY)), 'Testimonial public cache is not a scalar array.');

    echo "SHOWCASE_WORKFLOW_SMOKE=PASS\n";
} finally {
    DB::rollBack();
    Cache::forget(TeamMember::PUBLIC_CACHE_KEY);
    Cache::forget(Testimonial::PUBLIC_CACHE_KEY);
}
