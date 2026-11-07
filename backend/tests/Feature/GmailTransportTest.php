<?php

namespace Tests\Feature;

use App\Mail\VerifyEmailCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * يغطّي ناقل Gmail عبر HTTPS — الإرسال من حساب Gmail حيث تحجب الاستضافة
 * منافذ SMTP. بلا أي اتصال بالشبكة.
 */
class GmailTransportTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

    private function useGmail(): void
    {
        config([
            'mail.default' => 'gmail',
            'mail.mailers.gmail.client_id' => 'client-id.apps.googleusercontent.com',
            'mail.mailers.gmail.client_secret' => 'client-secret',
            'mail.mailers.gmail.refresh_token' => 'refresh-token',
            'mail.from.address' => 'menhity@gmail.com',
            'mail.from.name' => 'بَوْصلة',
        ]);
    }

    /** @param  array<string, mixed>  $overrides */
    private function fakeGoogle(array $overrides = []): void
    {
        Http::fake($overrides + [
            'oauth2.googleapis.com/*' => Http::response([
                'access_token' => 'ya29.test',
                'expires_in' => 3599,
                'token_type' => 'Bearer',
            ]),
            'gmail.googleapis.com/*' => Http::response(['id' => 'msg_1', 'labelIds' => ['SENT']]),
        ]);
    }

    private function send(): void
    {
        $user = new User(['name' => 'سارة علي', 'email' => 'sara@example.com']);

        Mail::to('sara@example.com')->send(new VerifyEmailCodeMail($user, '654321'));
    }

    /** يفكّ ترميز base64url الذي تطلبه Gmail ويعيد نص الرسالة الخام */
    private function rawOf(Request $request): string
    {
        $raw = (string) ($request->data()['raw'] ?? '');

        $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]+$/', $raw, 'الحقل raw ليس base64url');

        return (string) base64_decode(strtr($raw, '-_', '+/'));
    }

    private function requestsTo(string $url): int
    {
        return Http::recorded(fn (Request $request) => $request->url() === $url)->count();
    }

    public function test_it_sends_the_raw_message_with_a_fresh_access_token(): void
    {
        $this->useGmail();
        $this->fakeGoogle();

        $this->send();

        Http::assertSent(fn (Request $request) => $request->url() === self::TOKEN_URL
            && $request['grant_type'] === 'refresh_token'
            && $request['refresh_token'] === 'refresh-token'
            && $request['client_id'] === 'client-id.apps.googleusercontent.com'
            && $request['client_secret'] === 'client-secret');

        Http::assertSent(function (Request $request) {
            if ($request->url() !== self::SEND_URL) {
                return false;
            }

            $raw = $this->rawOf($request);

            return $request->hasHeader('Authorization', 'Bearer ya29.test')
                && str_contains($raw, 'To: sara@example.com')
                && str_contains($raw, 'menhity@gmail.com')
                && str_contains(quoted_printable_decode($raw), '654321');
        });
    }

    public function test_it_keeps_bcc_recipients_in_the_raw_message(): void
    {
        $this->useGmail();
        $this->fakeGoogle();
        $user = new User(['name' => 'سارة علي', 'email' => 'sara@example.com']);

        // Gmail يقرأ المستلمين من الترويسات، وSymfony يحذف Bcc منها افتراضياً
        Mail::to('sara@example.com')->bcc('archive@example.com')->send(new VerifyEmailCodeMail($user, '654321'));

        Http::assertSent(fn (Request $request) => $request->url() === self::SEND_URL
            && str_contains($this->rawOf($request), 'Bcc: archive@example.com'));
    }

    public function test_it_reuses_the_access_token_across_messages(): void
    {
        $this->useGmail();
        $this->fakeGoogle();

        $this->send();
        $this->send();

        $this->assertSame(1, $this->requestsTo(self::TOKEN_URL));
        $this->assertSame(2, $this->requestsTo(self::SEND_URL));
    }

    public function test_it_refreshes_the_token_once_when_gmail_rejects_it(): void
    {
        $this->useGmail();
        $this->fakeGoogle([
            'gmail.googleapis.com/*' => Http::sequence()
                ->push(['error' => ['code' => 401, 'message' => 'Invalid Credentials']], 401)
                ->push(['id' => 'msg_1']),
        ]);

        $this->send();

        $this->assertSame(2, $this->requestsTo(self::TOKEN_URL));
        $this->assertSame(2, $this->requestsTo(self::SEND_URL));
    }

    public function test_it_surfaces_a_gmail_api_error(): void
    {
        $this->useGmail();
        $this->fakeGoogle([
            'gmail.googleapis.com/*' => Http::response([
                'error' => ['code' => 403, 'message' => 'Gmail API has not been used in project 123 before or it is disabled.'],
            ], 403),
        ]);

        $this->expectExceptionMessageMatches('/Gmail API has not been used/');

        $this->send();
    }

    public function test_it_surfaces_a_rejected_refresh_token(): void
    {
        $this->useGmail();
        $this->fakeGoogle([
            'oauth2.googleapis.com/*' => Http::response([
                'error' => 'invalid_grant',
                'error_description' => 'Token has been expired or revoked.',
            ], 400),
        ]);

        $this->expectExceptionMessageMatches('/invalid_grant/');

        $this->send();
    }

    public function test_registration_reports_when_the_link_could_not_be_sent(): void
    {
        $this->useGmail();
        $this->fakeGoogle([
            'gmail.googleapis.com/*' => Http::response(['error' => ['message' => 'Backend Error']], 500),
        ]);

        // فشل المزوّد لا يُسقط إنشاء الحساب، لكن الواجهة تُبلَّغ أن الرمز لم يُرسَل
        $this->postJson('/api/v1/auth/register', [
            'name' => 'سارة أحمد',
            'email' => 'new@example.com',
            'password' => 'Menhity@2026',
            'password_confirmation' => 'Menhity@2026',
            'accept_terms' => true,
        ])
            ->assertCreated()
            ->assertJsonPath('requires_verification', true)
            ->assertJsonPath('link_sent', false);

        $this->assertDatabaseHas('users', ['email' => 'new@example.com']);
    }
}
