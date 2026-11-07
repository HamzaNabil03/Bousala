<?php

namespace App\Mail\Transport;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * عميل OAuth 2.0 لحساب Google.
 *
 * يخدم طرفين: أمر menhity:gmail-auth عند الإعداد (رابط الموافقة، ثم
 * تبديل رمز الموافقة برمز تحديث دائم)، وناقل GmailApiTransport مع كل
 * رسالة (تحويل رمز التحديث إلى رمز وصول قصير العمر مع تخزينه مؤقتاً).
 */
class GmailOAuth
{
    public const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

    public const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

    /** إرسال البريد فقط، وبريد الحساب لعرضه في الأمر — لا قراءة ولا حذف */
    public const SCOPES = [
        'https://www.googleapis.com/auth/gmail.send',
        'openid',
        'email',
    ];

    private const CACHE_PREFIX = 'menhity:gmail:access-token:';

    public function __construct(
        private readonly string $clientId,
        private readonly string $clientSecret,
        private readonly string $refreshToken = '',
        private readonly int $timeout = 15,
    ) {}

    /** رابط شاشة موافقة Google الذي يفتحه المستخدم في متصفحه */
    public function authorizationUrl(string $redirectUri, string $state): string
    {
        return self::AUTH_ENDPOINT.'?'.http_build_query([
            'client_id' => $this->clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', self::SCOPES),
            // offline يمنح رمز تحديث، وconsent يضمن إصداره حتى لو سبقت الموافقة
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ]);
    }

    /**
     * يبدّل رمز الموافقة برمز تحديث دائم.
     *
     * @return array{refresh_token: string, email: ?string}
     */
    public function exchangeCode(string $code, string $redirectUri): array
    {
        $data = $this->token([
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $redirectUri,
        ]);

        $refreshToken = (string) ($data['refresh_token'] ?? '');

        if ($refreshToken === '') {
            throw new RuntimeException(
                'لم تُعِد Google رمز تحديث. أزل صلاحية التطبيق من myaccount.google.com/permissions ثم أعد المحاولة.',
            );
        }

        return [
            'refresh_token' => $refreshToken,
            'email' => self::emailFromIdToken($data['id_token'] ?? null),
        ];
    }

    /** رمز وصول صالح: من الذاكرة المؤقتة، أو بتحديثه من Google */
    public function accessToken(): string
    {
        $cached = Cache::get($this->cacheKey());

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $data = $this->token([
            'grant_type' => 'refresh_token',
            'refresh_token' => $this->refreshToken,
        ]);

        $token = (string) ($data['access_token'] ?? '');

        if ($token === '') {
            throw new RuntimeException('لم تُعِد Google رمز وصول.');
        }

        // نُبقي هامش دقيقة قبل انتهاء الصلاحية الفعلية (ساعة عادةً)
        $ttl = max(60, (int) ($data['expires_in'] ?? 3600) - 60);
        Cache::put($this->cacheKey(), $token, now()->addSeconds($ttl));

        return $token;
    }

    /** إبطال رمز الوصول المخزَّن — حين ترفضه Google قبل انتهاء مدته */
    public function forgetAccessToken(): void
    {
        Cache::forget($this->cacheKey());
    }

    /**
     * يستخرج رمز الموافقة مما يلصقه المستخدم: الرابط الكامل الذي انتقل
     * إليه المتصفح، أو الرمز وحده.
     */
    public static function codeFromRedirect(string $input): ?string
    {
        $input = trim($input);

        if ($input === '') {
            return null;
        }

        if (! str_contains($input, '?') && ! str_starts_with($input, 'http')) {
            return $input;
        }

        parse_str((string) parse_url($input, PHP_URL_QUERY), $query);
        $code = $query['code'] ?? null;

        return is_string($code) && $code !== '' ? $code : null;
    }

    /** بريد الحساب من id_token — للعرض فقط، فلا حاجة للتحقق من التوقيع */
    public static function emailFromIdToken(?string $idToken): ?string
    {
        $segments = explode('.', (string) $idToken);

        if (count($segments) < 2) {
            return null;
        }

        $payload = json_decode((string) base64_decode(strtr($segments[1], '-_', '+/')), true);
        $email = is_array($payload) ? ($payload['email'] ?? null) : null;

        return is_string($email) && $email !== '' ? $email : null;
    }

    /**
     * @param  array<string, string>  $params
     * @return array<string, mixed>
     */
    private function token(array $params): array
    {
        $response = Http::asForm()
            ->timeout($this->timeout)
            ->post(self::TOKEN_ENDPOINT, $params + [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]);

        if ($response->failed()) {
            $error = $response->json('error') ?? 'unknown_error';
            $detail = $response->json('error_description') ?? 'استجابة غير متوقعة';

            throw new RuntimeException("رفضت Google طلب الرمز ({$error}): {$detail}");
        }

        return (array) $response->json();
    }

    private function cacheKey(): string
    {
        // يتغيّر المفتاح بتغيّر الحساب أو العميل، فلا يُستخدم رمز حساب سابق
        return self::CACHE_PREFIX.sha1($this->clientId.'|'.$this->refreshToken);
    }
}
