<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * تسجيل الدخول عبر Google مستقل عن إعدادات Gmail المستخدمة لإرسال
     * البريد. لا نعيد استخدام مفاتيح Gmail حتى تبقى الصلاحيات مفصولة.
     */
    'google_auth' => [
        'client_id' => env('GOOGLE_AUTH_CLIENT_ID'),
        'client_secret' => env('GOOGLE_AUTH_CLIENT_SECRET'),
        'redirect_uri' => env(
            'GOOGLE_AUTH_REDIRECT_URI',
            rtrim((string) env('APP_URL', 'http://localhost:8000'), '/').'/api/v1/auth/google/callback',
        ),
        'frontend_url' => rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/'),
    ],

];
