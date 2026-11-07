<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * مصادقة اختيارية: المسار متاح للزوار، لكن إن حمل الطلب توكناً صالحاً
 * يُسجَّل المستخدم حتى تظهر نسبة المطابقة وحالة الحفظ في نتائج المنح.
 */
class OptionalAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken() && ($user = Auth::guard('sanctum')->user())) {
            Auth::setUser($user);
        }

        return $next($request);
    }
}
