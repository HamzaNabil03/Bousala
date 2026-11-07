<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\NotificationType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AccessTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class GoogleAuthController extends Controller
{
    private const PROVIDER = 'google';
    private const STATE_TTL_SECONDS = 600;
    private const HANDOFF_TTL_SECONDS = 120;

    public function __construct(private readonly AccessTokenService $tokens) {}

    /** بدء Authorization Code Flow مع PKCE وحالة محفوظة على الخادم. */
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->frontendRedirect('not_configured', $this->safeNext($request->query('next')));
        }

        $state = $this->randomToken(32);
        $verifier = $this->randomToken(64);
        $next = $this->safeNext($request->query('next'));

        Cache::put($this->stateKey($state), [
            'verifier' => $verifier,
            'next' => $next,
        ], now()->addSeconds(self::STATE_TTL_SECONDS));

        $query = http_build_query([
            'client_id' => config('services.google_auth.client_id'),
            'redirect_uri' => config('services.google_auth.redirect_uri'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'code_challenge' => $this->base64Url(hash('sha256', $verifier, true)),
            'code_challenge_method' => 'S256',
            'prompt' => 'select_account',
        ], '', '&', PHP_QUERY_RFC3986);

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?'.$query);
    }

    /** استقبال Google وإنشاء رمز تسليم داخلي قصير العمر بدلاً من كشف توكن الجلسة في الرابط. */
    public function callback(Request $request): RedirectResponse
    {
        $state = (string) $request->query('state', '');
        $stored = $state !== '' ? Cache::pull($this->stateKey($state)) : null;
        $next = $this->safeNext(is_array($stored) ? ($stored['next'] ?? null) : null);

        if (! is_array($stored) || empty($stored['verifier'])) {
            return $this->frontendRedirect('invalid_state', $next);
        }

        if ($request->filled('error')) {
            return $this->frontendRedirect(
                $request->query('error') === 'access_denied' ? 'cancelled' : 'provider_error',
                $next,
            );
        }

        $code = (string) $request->query('code', '');
        if ($code === '') {
            return $this->frontendRedirect('missing_code', $next);
        }

        try {
            $tokenResponse = Http::asForm()->acceptJson()->timeout(15)->post(
                'https://oauth2.googleapis.com/token',
                [
                    'client_id' => config('services.google_auth.client_id'),
                    'client_secret' => config('services.google_auth.client_secret'),
                    'code' => $code,
                    'code_verifier' => $stored['verifier'],
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => config('services.google_auth.redirect_uri'),
                ],
            );

            if (! $tokenResponse->successful() || ! $tokenResponse->json('access_token')) {
                return $this->frontendRedirect('token_exchange_failed', $next);
            }

            $profileResponse = Http::withToken($tokenResponse->json('access_token'))
                ->acceptJson()
                ->timeout(15)
                ->get('https://openidconnect.googleapis.com/v1/userinfo');

            $profile = $profileResponse->json();
            if (! $profileResponse->successful() || ! $this->validProfile($profile)) {
                return $this->frontendRedirect('unverified_email', $next);
            }

            $user = $this->resolveUser($profile);
        } catch (RuntimeException $exception) {
            return $this->frontendRedirect($exception->getMessage(), $next);
        } catch (Throwable $exception) {
            report($exception);

            return $this->frontendRedirect('provider_unavailable', $next);
        }

        if ($user->status === UserStatus::Suspended) {
            return $this->frontendRedirect('account_suspended', $next);
        }

        if ($user->status === UserStatus::Inactive) {
            $user->update(['status' => UserStatus::Active]);
        }

        $handoff = $this->randomToken(32);
        Cache::put($this->handoffKey($handoff), $user->id, now()->addSeconds(self::HANDOFF_TTL_SECONDS));

        return $this->frontendCallback([
            'code' => $handoff,
            'next' => $next,
        ]);
    }

    /** استبدال رمز التسليم مرة واحدة بتوكن Sanctum المعتاد للمشروع. */
    public function exchange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'min:32', 'max:160'],
        ]);

        $userId = Cache::pull($this->handoffKey($validated['code']));
        if (! $userId) {
            throw ValidationException::withMessages([
                'code' => 'انتهت صلاحية محاولة الدخول عبر Google. ابدأ المحاولة من جديد.',
            ]);
        }

        $user = User::find($userId);
        if (! $user || $user->status === UserStatus::Suspended) {
            abort(403, 'هذا الحساب غير متاح حالياً. تواصل مع الدعم لمزيد من التفاصيل.');
        }

        if ($user->status === UserStatus::Inactive) {
            $user->update(['status' => UserStatus::Active]);
        }

        return response()->json([
            'token' => $this->tokens->issue($request, $user),
            'user' => new UserResource($user->load('profile')),
        ]);
    }

    /** @param array<string, mixed> $profile */
    private function resolveUser(array $profile): User
    {
        $subject = (string) $profile['sub'];
        $email = Str::lower(trim((string) $profile['email']));

        $linked = User::query()
            ->where('oauth_provider', self::PROVIDER)
            ->where('oauth_id', $subject)
            ->first();

        if ($linked) {
            return $linked;
        }

        /*
         * لا نربط حساباً محلياً بمجرد تطابق البريد. حتى مع بريد Google
         * المؤكد، الربط الصامت قد يغيّر وسيلة دخول حساب إداري موجود.
         */
        if (User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
            throw new RuntimeException('account_exists');
        }

        return DB::transaction(function () use ($profile, $subject, $email): User {
            $user = User::create([
                'name' => trim((string) ($profile['name'] ?? '')) ?: Str::before($email, '@'),
                'email' => $email,
                'email_verified_at' => now(),
                'avatar_url' => isset($profile['picture']) ? (string) $profile['picture'] : null,
                'oauth_provider' => self::PROVIDER,
                'oauth_id' => $subject,
                'accepted_terms_at' => now(),
            ]);

            $user->profile()->create(['full_name_ar' => $user->name]);
            $user->notifications()->create([
                'type' => NotificationType::System,
                'title' => 'أهلاً بك في بَوْصلة 👋',
                'body' => 'أكمل ملفك الأكاديمي لنبدأ باقتراح المنح الأنسب لك.',
                'badge_label' => 'جديد',
                'action_label' => 'إكمال الملف',
                'action_url' => '/dashboard/profile',
            ]);

            return $user;
        });
    }

    /** @param mixed $profile */
    private function validProfile($profile): bool
    {
        return is_array($profile)
            && isset($profile['sub'], $profile['email'])
            && filter_var($profile['email'], FILTER_VALIDATE_EMAIL)
            && filter_var($profile['email_verified'] ?? false, FILTER_VALIDATE_BOOL);
    }

    private function isConfigured(): bool
    {
        return filled(config('services.google_auth.client_id'))
            && filled(config('services.google_auth.client_secret'))
            && filled(config('services.google_auth.redirect_uri'));
    }

    private function safeNext(mixed $next): string
    {
        if (! is_string($next) || ! Str::startsWith($next, '/') || Str::startsWith($next, '//')) {
            return '';
        }

        return mb_substr($next, 0, 500);
    }

    private function frontendRedirect(string $error, string $next = ''): RedirectResponse
    {
        return $this->frontendCallback(array_filter(['error' => $error, 'next' => $next]));
    }

    /** @param array<string, string> $query */
    private function frontendCallback(array $query): RedirectResponse
    {
        $url = config('services.google_auth.frontend_url').'/oauth/google/callback';

        return redirect()->away($url.'?'.http_build_query($query, '', '&', PHP_QUERY_RFC3986));
    }

    private function stateKey(string $state): string
    {
        return 'oauth:google:state:'.hash('sha256', $state);
    }

    private function handoffKey(string $code): string
    {
        return 'oauth:google:handoff:'.hash('sha256', $code);
    }

    private function randomToken(int $bytes): string
    {
        return $this->base64Url(random_bytes($bytes));
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
