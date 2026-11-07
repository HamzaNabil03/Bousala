<?php

namespace Tests\Feature;

use App\Mail\PasswordResetCodeMail;
use App\Mail\VerifyEmailCodeMail;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\VerificationCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * يغطّي دورة تفعيل الحساب كاملة: إرسال الرابط عند التسجيل، حجب الدخول
 * قبل التفعيل، صحّة الرمز في الرابط، وانتهاء صلاحيته.
 */
class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Menhity@2026';

    /** @return array{0: User, 1: string} المستخدم ورمز التفعيل الصريح */
    private function unverifiedUserWithToken(): array
    {
        $user = User::factory()->unverified()->create(['password' => self::PASSWORD]);
        $token = app(VerificationCodeService::class)->issueActivationToken($user);

        return [$user, $token];
    }

    public function test_registration_sends_an_activation_link(): void
    {
        Mail::fake();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'سارة أحمد',
            'email' => 'sara@example.com',
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
            'accept_terms' => true,
        ])
            ->assertCreated()
            ->assertJsonPath('link_sent', true);

        Mail::assertSent(
            VerifyEmailCodeMail::class,
            fn (VerifyEmailCodeMail $mail) => $mail->hasTo('sara@example.com')
                && str_contains($mail->activationUrl, '/verify-email?')
                && str_contains($mail->activationUrl, 'token=')
                && str_contains($mail->activationUrl, rawurlencode('sara@example.com')),
        );

        $user = User::where('email', 'sara@example.com')->first();

        $this->assertSame(
            1,
            $user->verificationCodes()->where('type', VerificationCode::TYPE_EMAIL_VERIFY)->count(),
        );
    }

    public function test_the_stored_token_is_hashed_and_not_readable(): void
    {
        [$user, $token] = $this->unverifiedUserWithToken();

        $record = $user->verificationCodes()->latest()->first();

        $this->assertSame(64, mb_strlen($token), 'طول الرمز يجعل تخمينه غير عملي');
        $this->assertNotSame($token, $record->code_hash);
        $this->assertStringNotContainsString($token, $record->code_hash);
    }

    public function test_an_unverified_user_cannot_log_in_and_gets_a_fresh_code(): void
    {
        Mail::fake();
        [$user] = $this->unverifiedUserWithToken();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => self::PASSWORD,
        ])
            ->assertStatus(409)
            ->assertJsonPath('requires_verification', true)
            ->assertJsonPath('email', $user->email)
            ->assertJsonMissingPath('token');

        Mail::assertSent(VerifyEmailCodeMail::class);
    }

    public function test_a_verified_user_logs_in_normally(): void
    {
        Mail::fake();
        $user = User::factory()->create(['password' => self::PASSWORD]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => self::PASSWORD,
        ])->assertOk()->assertJsonStructure(['token', 'user']);

        Mail::assertNothingSent();
    }

    public function test_the_correct_code_verifies_the_email_and_returns_a_token(): void
    {
        [$user, $token] = $this->unverifiedUserWithToken();

        $this->postJson('/api/v1/auth/verify-email', [
            'email' => $user->email,
            'token' => $token,
        ])->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'email']]);

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertNotNull($user->verificationCodes()->latest()->first()->used_at);
    }

    public function test_a_used_code_cannot_be_replayed(): void
    {
        [$user, $token] = $this->unverifiedUserWithToken();

        $this->postJson('/api/v1/auth/verify-email', ['email' => $user->email, 'token' => $token])->assertOk();

        // الحساب صار مؤكَّداً، فلا يُسلَّم توكن ثانٍ من الرمز نفسه
        $this->postJson('/api/v1/auth/verify-email', ['email' => $user->email, 'token' => $token])
            ->assertOk()
            ->assertJsonPath('already_verified', true)
            ->assertJsonMissingPath('token');
    }

    public function test_a_wrong_token_is_rejected(): void
    {
        [$user] = $this->unverifiedUserWithToken();

        $this->postJson('/api/v1/auth/verify-email', [
            'email' => $user->email,
            'token' => str_repeat('z', 64),
        ])->assertUnprocessable()->assertJsonValidationErrors('token');

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_a_malformed_token_is_rejected_before_any_lookup(): void
    {
        [$user] = $this->unverifiedUserWithToken();

        $this->postJson('/api/v1/auth/verify-email', ['email' => $user->email, 'token' => 'short'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('token');
    }

    public function test_an_expired_link_is_rejected(): void
    {
        [$user, $token] = $this->unverifiedUserWithToken();
        $user->verificationCodes()->latest()->first()->update(['expires_at' => now()->subMinute()]);

        $this->postJson('/api/v1/auth/verify-email', ['email' => $user->email, 'token' => $token])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('token');
    }

    public function test_resending_issues_a_new_code_and_cancels_the_previous_one(): void
    {
        Mail::fake();
        [$user, $first] = $this->unverifiedUserWithToken();

        $this->postJson('/api/v1/auth/resend-verification', ['email' => $user->email])->assertOk();

        Mail::assertSent(VerifyEmailCodeMail::class);

        // الرمز القديم بطل مفعوله فوراً
        $this->postJson('/api/v1/auth/verify-email', ['email' => $user->email, 'token' => $first])
            ->assertUnprocessable();
    }

    public function test_resending_for_an_unknown_email_stays_silent(): void
    {
        Mail::fake();

        $this->postJson('/api/v1/auth/resend-verification', ['email' => 'nobody@example.com'])
            ->assertOk()
            ->assertJsonStructure(['message']);

        Mail::assertNothingSent();
    }

    public function test_verifying_an_unknown_email_reveals_nothing(): void
    {
        $this->postJson('/api/v1/auth/verify-email', ['email' => 'nobody@example.com', 'token' => str_repeat('a', 64)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('token');
    }

    public function test_password_reset_sends_a_real_email(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();

        Mail::assertSent(
            PasswordResetCodeMail::class,
            fn (PasswordResetCodeMail $mail) => $mail->hasTo($user->email),
        );
    }

    public function test_resetting_the_password_also_marks_the_email_verified(): void
    {
        [$user] = $this->unverifiedUserWithToken();
        $code = app(VerificationCodeService::class)->issue($user, VerificationCode::TYPE_PASSWORD_RESET);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'code' => $code,
            'password' => 'NewMenhity@2026',
            'password_confirmation' => 'NewMenhity@2026',
        ])->assertOk();

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_a_failing_mailer_does_not_break_registration(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        $this->postJson('/api/v1/auth/register', [
            'name' => 'سارة أحمد',
            'email' => 'sara@example.com',
            'password' => self::PASSWORD,
            'password_confirmation' => self::PASSWORD,
            'accept_terms' => true,
        ])->assertCreated();

        $this->assertDatabaseHas('users', ['email' => 'sara@example.com']);
    }
}
