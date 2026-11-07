<?php

namespace Tests\Feature;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_register_and_is_asked_to_verify_the_email(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'سارة أحمد',
            'email' => 'sara@example.com',
            'password' => 'Menhity@2026',
            'password_confirmation' => 'Menhity@2026',
            'accept_terms' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('requires_verification', true)
            ->assertJsonPath('email', 'sara@example.com')
            ->assertJsonMissingPath('token');

        $user = User::where('email', 'sara@example.com')->first();

        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at, 'الحساب الجديد يبدأ غير مؤكَّد');
        $this->assertNotNull($user->profile, 'يجب إنشاء ملف أكاديمي مع الحساب');
        $this->assertSame(1, $user->notifications()->count(), 'يجب إرسال إشعار ترحيبي');
    }

    public function test_registration_rejects_a_weak_password(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'سارة أحمد',
            'email' => 'sara@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'accept_terms' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_registration_requires_accepting_the_terms(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'سارة أحمد',
            'email' => 'sara@example.com',
            'password' => 'Menhity@2026',
            'password_confirmation' => 'Menhity@2026',
        ])->assertUnprocessable()->assertJsonValidationErrors('accept_terms');
    }

    public function test_a_user_can_log_in_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'student@menhity.com',
            'password' => 'Menhity@2026',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'student@menhity.com',
            'password' => 'Menhity@2026',
        ])->assertOk()->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_credentials(): void
    {
        User::factory()->create(['email' => 'student@menhity.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'student@menhity.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_a_suspended_account_cannot_log_in(): void
    {
        User::factory()->create([
            'email' => 'lina@example.com',
            'password' => 'Menhity@2026',
            'status' => UserStatus::Suspended,
            'suspension_reason' => 'مخالفة سياسة الاستخدام',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'lina@example.com',
            'password' => 'Menhity@2026',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_the_current_user_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_read_their_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_logging_out_revokes_only_the_current_device_token(): void
    {
        $user = User::factory()->create(['password' => 'Menhity@2026']);

        $first = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Menhity@2026',
        ])->json('token');

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Menhity@2026',
        ])->assertOk();

        $this->assertSame(2, $user->tokens()->count());

        $this->withHeader('Authorization', "Bearer {$first}")
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertSame(1, $user->fresh()->tokens()->count());
    }
}
