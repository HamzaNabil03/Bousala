<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

/**
 * توكن الوصول هو "الجلسة" في بَوْصلة — يحمل بيانات الجهاز
 * لتغذية شاشة "الجلسات والأجهزة النشطة" وإتاحة إنهاء أي جهاز على حدة.
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $fillable = [
        'name',
        'token',
        'abilities',
        'expires_at',
        'ip_address',
        'user_agent',
        'browser',
        'os',
        'device_type',
    ];
}
