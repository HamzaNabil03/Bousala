<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    /** تغيير كلمة المرور — يُنهي الجلسات على الأجهزة الأخرى */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ], [
            'new_password.confirmed' => 'كلمتا المرور غير متطابقتين.',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'كلمة المرور الحالية غير صحيحة.',
            ]);
        }

        $user->update(['password' => $validated['new_password']]);

        $currentTokenId = $user->currentAccessToken()->id;
        $user->tokens()->whereKeyNot($currentTokenId)->delete();

        return response()->json([
            'message' => 'تم تحديث كلمة المرور، وتم إنهاء جلساتك على الأجهزة الأخرى.',
        ]);
    }

    /** الخصوصية والأمان */
    public function updatePrivacy(Request $request): UserResource
    {
        $validated = $request->validate([
            'profile_visible' => ['required', 'boolean'],
            'share_data_with_universities' => ['required', 'boolean'],
        ]);

        $request->user()->update($validated);

        return new UserResource($request->user()->fresh()->load('profile'));
    }

    /** تنبيهات البريد */
    public function updateNotifications(Request $request): UserResource
    {
        $validated = $request->validate([
            'notify_new_matches' => ['required', 'boolean'],
            'notify_application_status' => ['required', 'boolean'],
            'notify_news' => ['required', 'boolean'],
        ]);

        $request->user()->update($validated);

        return new UserResource($request->user()->fresh()->load('profile'));
    }

    /** اللغة والمنطقة الزمنية */
    public function updateLocale(Request $request): UserResource
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:ar,en'],
            'timezone' => ['required', 'string', 'timezone'],
        ]);

        $request->user()->update($validated);

        return new UserResource($request->user()->fresh()->load('profile'));
    }

    /** تعطيل الحساب مؤقتاً — يُعاد تفعيله عند تسجيل الدخول مجدداً */
    public function deactivate(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->update(['status' => UserStatus::Inactive]);
        $user->tokens()->delete();

        return response()->json(['message' => 'تم تعطيل حسابك مؤقتاً.']);
    }

    /** حذف الحساب نهائياً */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'confirm' => ['required', 'string', 'in:حذف'],
        ], [
            'confirm.in' => 'اكتب كلمة «حذف» للتأكيد.',
        ]);

        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'تم حذف حسابك وكل بياناتك نهائياً.']);
    }
}
