<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** الجلسات والأجهزة النشطة — كل توكن يمثّل جهازاً */
class SessionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $sessions = $request->user()->tokens()
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->latest('last_used_at')
            ->get();

        return SessionResource::collection($sessions);
    }

    /** إنهاء جلسة جهاز محدّد */
    public function destroy(Request $request, int $token): JsonResponse
    {
        $user = $request->user();
        $isCurrent = $user->currentAccessToken()->id === $token;

        $deleted = $user->tokens()->whereKey($token)->delete();

        if (! $deleted) {
            return response()->json(['message' => 'الجلسة غير موجودة.'], 404);
        }

        return response()->json([
            'message' => 'تم إنهاء الجلسة.',
            'logged_out' => $isCurrent,
        ]);
    }

    /** تسجيل الخروج من كافة الأجهزة */
    public function destroyAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج من كافة الأجهزة.',
            'logged_out' => true,
        ]);
    }
}
