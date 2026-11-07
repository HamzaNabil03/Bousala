<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * إصدار توكنات الوصول مربوطة ببيانات الجهاز.
 *
 * كل توكن يمثّل جهازاً واحداً، فيستطيع المستخدم إنهاء جلسة بعينها
 * من صفحة الأجهزة دون المساس ببقية الجلسات.
 */
class AccessTokenService
{
    private const LIFETIME_DAYS = 30;

    public function __construct(private readonly DeviceService $devices) {}

    /** ينشئ توكناً جديداً ويعيد نصّه الصريح */
    public function issue(Request $request, User $user): string
    {
        $device = $this->devices->fromRequest($request);

        $token = $user->createToken(
            name: $device['browser'].' · '.$device['os'],
            expiresAt: now()->addDays(self::LIFETIME_DAYS),
        );

        $token->accessToken->forceFill($device)->save();

        // forceFill لأن last_login_at خارج $fillable عمداً — لا يُضبط من طلب
        $user->forceFill(['last_login_at' => now()])->save();

        return $token->plainTextToken;
    }
}
