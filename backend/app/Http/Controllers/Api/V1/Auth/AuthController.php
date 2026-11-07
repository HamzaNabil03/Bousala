<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\NotificationType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\AccessTokenService;
use App\Services\VerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly AccessTokenService $tokens,
        private readonly VerificationCodeService $codes,
    ) {}

    /**
     * إنشاء حساب جديد وإرسال رابط التفعيل.
     *
     * لا يُسلَّم توكن هنا — الجلسة تبدأ بعد ضغط الرابط، فلا يُستخدم
     * الحساب ببريد لا يملكه صاحبه.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = User::create([
                'name' => $request->string('name')->trim()->value(),
                'email' => $request->string('email')->value(),
                'password' => $request->string('password')->value(),
                'accepted_terms_at' => now(),
            ]);

            $user->profile()->create(['full_name_ar' => $user->name]);

            $user->notifications()->create([
                'type' => NotificationType::System,
                'title' => 'أهلاً بك في بَوْصلة 👋',
                'body' => 'أكمل ملفك الأكاديمي لنبدأ باقتراح المنح الأنسب لك.',
                'badge_label' => 'جديد',
                'action_label' => 'إكمال الملف',
                'action_url' => '/dashboard/profile',
            ]);

            return $user;
        });

        $sent = $this->codes->send($user, VerificationCode::TYPE_EMAIL_VERIFY);

        return response()->json([
            'message' => $sent
                ? 'أنشأنا حسابك وأرسلنا رابط التفعيل إلى بريدك الإلكتروني.'
                : 'أنشأنا حسابك، لكن تعذّر إرسال رابط التفعيل الآن. جرّب «إعادة الإرسال» بعد قليل.',
            'email' => $user->email,
            'requires_verification' => true,
            // false تعني أن الرسالة لم تغادر الخادم أصلاً — فتنبّه الواجهة بدل انتظار بريد لن يصل
            'link_sent' => $sent,
        ], 201);
    }

    /** تسجيل الدخول */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->string('email')->value())->first();

        // رسالة موحّدة حتى لا نكشف وجود الحساب من عدمه
        if (! $user?->password || ! Hash::check($request->string('password')->value(), $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if ($user->status === UserStatus::Suspended) {
            throw ValidationException::withMessages([
                'email' => $user->suspension_reason
                    ? "تم إيقاف هذا الحساب. السبب: {$user->suspension_reason}"
                    : 'تم إيقاف هذا الحساب. تواصل مع الدعم لمزيد من التفاصيل.',
            ]);
        }

        /*
         * حساب غير مفعَّل: نرسل رابطاً جديداً ونعيد 409 مع علامة صريحة
         * تقرأها الواجهة لتنقل المستخدم إلى شاشة التفعيل.
         */
        if (! $user->hasVerifiedEmail()) {
            $sent = $this->codes->send($user, VerificationCode::TYPE_EMAIL_VERIFY);

            return response()->json([
                'message' => $sent
                    ? 'لم يتم تأكيد بريدك بعد. أرسلنا إليك رمز تأكيد جديد.'
                    : 'لم يتم تأكيد بريدك بعد، وتعذّر إرسال رمز جديد الآن. جرّب «إعادة الإرسال» بعد قليل.',
                'email' => $user->email,
                'requires_verification' => true,
                'link_sent' => $sent,
            ], 409);
        }

        // الحساب المعطّل مؤقتاً يُعاد تفعيله بمجرّد نجاح الدخول
        if ($user->status === UserStatus::Inactive) {
            $user->update(['status' => UserStatus::Active]);
        }

        return response()->json([
            'token' => $this->tokens->issue($request, $user),
            'user' => new UserResource($user->load('profile')),
        ]);
    }

    /** المستخدم الحالي */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('profile'));
    }

    /** تسجيل الخروج من الجهاز الحالي فقط */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->forceFill(['last_seen_at' => null])->save();
        $user->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج بنجاح.']);
    }
}
