<?php

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\OptionalAuthenticate;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'active' => EnsureUserIsActive::class,
            'auth.optional' => OptionalAuthenticate::class,
        ]);

        // لا توجد شاشة دخول على الخادم — الزائر غير المصادق يحصل على 401 بصيغة JSON
        $middleware->redirectGuestsTo(fn () => null);

        /*
         * منصّات الاستضافة (Render وRailway وغيرها) تنهي TLS عند وسيط أمامها،
         * فبدون الثقة به تُبنى روابط الترقيم بـ http وتُحجب كمحتوى مختلط
         * على واجهة تعمل بـ https.
         */
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // كل مسارات api تُعيد JSON دائماً
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'يجب تسجيل الدخول للمتابعة.'], 401);
            }

            return null;
        });
    })->create();
