<?php

namespace Tests\Unit;

use App\Mail\Transport\GmailOAuth;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

/** يغطّي خطوات OAuth التي يعتمد عليها أمر menhity:gmail-auth. بلا شبكة. */
class GmailOAuthTest extends TestCase
{
    private const REDIRECT = 'http://127.0.0.1:8765';

    private function oauth(): GmailOAuth
    {
        return new GmailOAuth('client-id', 'client-secret');
    }

    public function test_the_consent_url_asks_for_send_only_offline_access(): void
    {
        $url = $this->oauth()->authorizationUrl(self::REDIRECT, 'state-123');
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

        $this->assertStringStartsWith(GmailOAuth::AUTH_ENDPOINT.'?', $url);
        $this->assertSame('client-id', $query['client_id']);
        $this->assertSame(self::REDIRECT, $query['redirect_uri']);
        $this->assertSame('code', $query['response_type']);
        $this->assertSame('offline', $query['access_type']);
        $this->assertSame('consent', $query['prompt']);
        $this->assertSame('state-123', $query['state']);
        $this->assertStringContainsString('gmail.send', $query['scope']);
        $this->assertStringNotContainsString('gmail.readonly', $query['scope']);
    }

    public function test_it_extracts_the_code_from_a_pasted_redirect_url_or_a_bare_code(): void
    {
        $this->assertSame('4/0Abc', GmailOAuth::codeFromRedirect('http://127.0.0.1:8765/?state=x&code=4%2F0Abc&scope=email'));
        $this->assertSame('4/0Abc', GmailOAuth::codeFromRedirect('  4/0Abc  '));
        $this->assertNull(GmailOAuth::codeFromRedirect('http://127.0.0.1:8765/?error=access_denied'));
        $this->assertNull(GmailOAuth::codeFromRedirect(''));
    }

    public function test_it_exchanges_the_code_for_a_refresh_token_and_reads_the_account_email(): void
    {
        $payload = rtrim(strtr(base64_encode((string) json_encode(['email' => 'samer@gmail.com'])), '+/', '-_'), '=');
        Http::fake(['oauth2.googleapis.com/*' => Http::response([
            'access_token' => 'ya29.a',
            'refresh_token' => 'r-1',
            'id_token' => "header.{$payload}.signature",
        ])]);

        $result = $this->oauth()->exchangeCode('4/0Abc', self::REDIRECT);

        $this->assertSame(['refresh_token' => 'r-1', 'email' => 'samer@gmail.com'], $result);
        Http::assertSent(fn (Request $request) => $request->url() === GmailOAuth::TOKEN_ENDPOINT
            && $request['grant_type'] === 'authorization_code'
            && $request['code'] === '4/0Abc'
            && $request['redirect_uri'] === self::REDIRECT
            && $request['client_secret'] === 'client-secret');
    }

    public function test_it_refuses_a_consent_that_did_not_yield_a_refresh_token(): void
    {
        Http::fake(['oauth2.googleapis.com/*' => Http::response(['access_token' => 'ya29.a'])]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/رمز تحديث/');

        $this->oauth()->exchangeCode('4/0Abc', self::REDIRECT);
    }
}
