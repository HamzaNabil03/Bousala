<?php

namespace App\Providers;

use App\Mail\Transport\GmailApiTransport;
use App\Mail\Transport\GmailOAuth;
use App\Mail\Transport\ResendApiTransport;
use App\Models\PersonalAccessToken;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // نستخدم نموذجاً موسّعاً للتوكن يحمل بيانات الجهاز
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // ناقل بريد يعمل عبر HTTPS حيث تحجب الاستضافة منافذ SMTP
        Mail::extend('resend', fn (array $config) => new ResendApiTransport(
            apiKey: (string) ($config['key'] ?? ''),
            timeout: (int) ($config['timeout'] ?? 15),
        ));

        // Gmail عبر HTTPS — للإرسال من حساب Gmail بلا نطاق حيث يُحجب SMTP
        Mail::extend('gmail', fn (array $config) => new GmailApiTransport(
            oauth: new GmailOAuth(
                clientId: (string) ($config['client_id'] ?? ''),
                clientSecret: (string) ($config['client_secret'] ?? ''),
                refreshToken: (string) ($config['refresh_token'] ?? ''),
                timeout: (int) ($config['timeout'] ?? 15),
            ),
            timeout: (int) ($config['timeout'] ?? 15),
        ));
    }
}
