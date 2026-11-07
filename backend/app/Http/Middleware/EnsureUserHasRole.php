<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * يشترط أن يكون دور المستخدم ضمن الأدوار المسموح بها.
 * الاستخدام: ->middleware('role:admin,moderator')
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role->value, $roles, true)) {
            return response()->json(
                ['message' => 'ليس لديك صلاحية للوصول إلى هذا المورد.'],
                403,
            );
        }

        return $next($request);
    }
}
