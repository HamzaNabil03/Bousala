<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.google_auth', [
            'client_id' => 'google-client-id',
            'client_secret' => 'google-client-secret',
            'redirect_uri' => 'http://localhost:8000/api/v1/auth/google/callback',
            'frontend_url' => 'http://localhost:5173',
        ]);
    }

    public function test_google_creates_a_verified_student_and_issues_a_session_through_a_one_time_code(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response(['access_token' => 'google-access-token']),
            'https://openidconnect.googleapis.com/v1/userinfo' => Http::response([
                'sub' => 'google-user-123',
                'email' => 'new.student@example.com',
                'email_verified' => true,
                'name' => 'طالب جديد',
                'picture' => 'https://example.com/avatar.jpg',
            ]),
        ]);

        $callbackLocation = $this->completeGoogleCallback();
        parse_str((string) parse_url($callbackLocation, PHP_URL_QUERY), $query);

        $response = $this->postJson('/api/v1/auth/google/exchange', ['code' => $query['code']]);

        $response->assertOk()->assertJsonStructure(['token', 'user']);
        $response->assertJsonPath('user.role', UserRole::Student->value);

        $user = User::where('email', 'new.student@example.com')->firstOrFail();
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertSame('google', $user->oauth_provider);
        $this->assertSame('google-user-123', $user->oauth_id);
        $this->assertNotNull($user->profile);

        // رمز التسليم لا يعمل إلا مرة واحدة.
        $this->postJson('/api/v1/auth/google/exchange', ['code' => $query['code']])
            ->assertUnprocessable();
    }

    public function test_google_does_not_silently_link_an_existing_email_account(): void
    {
        $existing = User::factory()->create(['email' => 'owner@example.com']);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response(['access_token' => 'google-access-token']),
            'https://openidconnect.googleapis.com/v1/userinfo' => Http::response([
                'sub' => 'different-google-subject',
                'email' => 'owner@example.com',
                'email_verified' => true,
                'name' => 'Existing Owner',
            ]),
        ]);

        $location = $this->completeGoogleCallback();

        $this->assertStringContainsString('error=account_exists', $location);
        $this->assertNull($existing->fresh()->oauth_provider);
        $this->assertNull($existing->fresh()->oauth_id);
        $this->assertSame(1, User::count());
    }

    public function test_a_previously_linked_admin_keeps_the_admin_role(): void
    {
        User::factory()->admin()->create([
            'email' => 'admin@example.com',
            'oauth_provider' => 'google',
            'oauth_id' => 'admin-google-subject',
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response(['access_token' => 'google-access-token']),
            'https://openidconnect.googleapis.com/v1/userinfo' => Http::response([
                'sub' => 'admin-google-subject',
                'email' => 'admin@example.com',
                'email_verified' => true,
                'name' => 'Admin',
            ]),
        ]);

        $location = $this->completeGoogleCallback();
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

        $this->postJson('/api/v1/auth/google/exchange', ['code' => $query['code']])
            ->assertOk()
            ->assertJsonPath('user.role', UserRole::Admin->value)
            ->assertJsonPath('user.is_admin_level', true);
    }

    private function completeGoogleCallback(): string
    {
        $start = $this->get('/api/v1/auth/google/redirect?next=%2Fdashboard%2Fsaved');
        $start->assertRedirectContains('https://accounts.google.com/o/oauth2/v2/auth');

        parse_str((string) parse_url($start->headers->get('Location'), PHP_URL_QUERY), $googleQuery);
        $this->assertNotEmpty($googleQuery['state'] ?? null);
        $this->assertSame('S256', $googleQuery['code_challenge_method'] ?? null);

        $callback = $this->get('/api/v1/auth/google/callback?'.http_build_query([
            'state' => $googleQuery['state'],
            'code' => 'authorization-code',
        ]));

        $callback->assertRedirect();

        return (string) $callback->headers->get('Location');
    }
}
