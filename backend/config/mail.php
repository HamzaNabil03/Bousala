<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | This option controls the default mailer that is used to send all email
    | messages unless another mailer is explicitly specified when sending
    | the message. All additional mailers can be configured within the
    | "mailers" array. Examples of each type of mailer are provided.
    |
    */

    'default' => env('MAIL_MAILER', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    |
    | Here you may configure all of the mailers used by your application plus
    | their respective settings. Several examples have been configured for
    | you and you are free to add your own as your application requires.
    |
    | Laravel supports a variety of mail "transport" drivers that can be used
    | when delivering an email. You may specify which one you're using for
    | your mailers below. You may also add additional mailers if needed.
    |
    | Supported: "smtp", "sendmail", "mailgun", "ses", "ses-v2",
    |            "postmark", "resend", "log", "array",
    |            "failover", "roundrobin"
    |
    */

    'mailers' => [

        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME'),
            'url' => env('MAIL_URL'),
            'host' => env('MAIL_HOST', '127.0.0.1'),
            'port' => env('MAIL_PORT', 2525),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            /*
             * بلا مهلة يعلّق الطلب كاملاً عند إعداد SMTP خاطئ أو خادم
             * لا يستجيب — ورسائل التحقق تُرسَل داخل طلب التسجيل نفسه.
             */
            'timeout' => (int) env('MAIL_TIMEOUT', 15),
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
        ],

        'ses' => [
            'transport' => 'ses',
        ],

        'postmark' => [
            'transport' => 'postmark',
            // 'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
            // 'client' => [
            //     'timeout' => 5,
            // ],
        ],

        /*
         * Resend عبر HTTPS — لا يحتاج منفذ SMTP، فيعمل على الاستضافات
         * التي تحجب المنافذ الصادرة 25 و465 و587.
         */
        'resend' => [
            'transport' => 'resend',
            'key' => env('RESEND_API_KEY'),
            'timeout' => (int) env('MAIL_TIMEOUT', 15),
        ],

        /*
         * Gmail عبر واجهته على HTTPS — لمن يرسل من حساب Gmail بلا نطاق خاص.
         * الاعتماد بـ OAuth 2.0: رمز التحديث يُصدَر مرة واحدة بأمر
         * php artisan menhity:gmail-auth، ولا حاجة لكلمة مرور تطبيق.
         */
        'gmail' => [
            'transport' => 'gmail',
            'client_id' => env('GMAIL_CLIENT_ID'),
            'client_secret' => env('GMAIL_CLIENT_SECRET'),
            'refresh_token' => env('GMAIL_REFRESH_TOKEN'),
            'timeout' => (int) env('MAIL_TIMEOUT', 15),
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -i'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
            'retry_after' => 60,
        ],

        'roundrobin' => [
            'transport' => 'roundrobin',
            'mailers' => [
                'ses',
                'postmark',
            ],
            'retry_after' => 60,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    |
    | You may wish for all emails sent by your application to be sent from
    | the same address. Here you may specify a name and address that is
    | used globally for all emails that are sent by your application.
    |
    */

    /*
     * عنوان الردّ. عنوان المُرسِل مقيَّد بنطاق موثَّق لدى المزوّد، أما هذا
     * فيمكن أن يكون أي بريد — فترسل المنصّة باسمها وتصل الردود إليك.
     */
    'reply_to' => [
        'address' => env('MAIL_REPLY_TO_ADDRESS'),
        'name' => env('MAIL_REPLY_TO_NAME', env('MAIL_FROM_NAME')),
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', env('APP_NAME', 'Laravel')),
    ],

];
