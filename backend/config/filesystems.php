<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        /*
         | مرفوعات الطلاب — سِيَرٌ وإشعارات تحويل وملفات مسلَّمة.
         |
         | قرص الحاوية على منصّات النشر مؤقّت: كل إعادة نشر تبدأ من صورة
         | نظيفة فتُمحى المرفوعات ويبقى سجلّها في قاعدة البيانات، فيرى
         | الطالب طلباً بمرفق لا ملف له. لذا يُوجَّه الجذر إلى قرصٍ مثبَّت
         | عبر PRIVATE_STORAGE_ROOT (مثلاً /data على Railway)، ويبقى
         | مسار المشروع افتراضاً للتطوير المحلّي.
         */
        'local' => [
            'driver' => 'local',
            'root' => env('PRIVATE_STORAGE_ROOT') ?: storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        /* صور الهوية والصفحة العامة التي يرفعها المدير. وجّه الجذر إلى
         * volume دائم في الإنتاج حتى تبقى الصور بعد إعادة النشر. */
        'site_media' => [
            'driver' => 'local',
            'root' => env('SITE_MEDIA_ROOT') ?: storage_path('app/public/site-media'),
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
