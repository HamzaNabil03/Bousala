<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** يمنع الحسابات الموقوفة من استخدام الـ API حتى لو كان التوكن صالحاً */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status === UserStatus::Suspended) {
            $user->tokens()->delete();

            return response()->json([
                'message' => $user->suspension_reason
                    ? "تم إيقاف هذا الحساب. السبب: {$user->suspension_reason}"
                    : 'تم إيقاف هذا الحساب. تواصل مع الدعم لمزيد من التفاصيل.',
            ], 403);
        }

        if ($user instanceof User) {
            $activityTime = now();

            $user->newQuery()
                ->whereKey($user->getKey())
                ->where(fn ($query) => $query
                    ->whereNull('last_seen_at')
                    ->orWhere('last_seen_at', '<=', $activityTime->copy()->subMinute()))
                ->update(['last_seen_at' => $activityTime]);
        }

        return $next($request);
    }
}
