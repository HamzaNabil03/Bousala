<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyCodeRequest;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\VerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * استعادة كلمة المرور برمز من ستة أرقام يُرسَل إلى بريد المستخدم.
 */
class PasswordResetController extends Controller
{
    public function __construct(private readonly VerificationCodeService $codes) {}

    /** إرسال رمز الاستعادة */
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $this->issueFor($request->string('email')->value());

        // الرسالة موحّدة سواء وُجد الحساب أم لا
        return response()->json([
            'message' => 'إذا كان البريد مسجّلاً لدينا فستصلك رسالة تحتوي رمز الاستعادة.',
        ]);
    }

    /** إعادة إرسال الرمز */
    public function resend(ForgotPasswordRequest $request): JsonResponse
    {
        $this->issueFor($request->string('email')->value());

        return response()->json(['message' => 'تم إرسال رمز جديد إلى بريدك الإلكتروني.']);
    }

    /** التحقق من صحة الرمز قبل الانتقال لشاشة كلمة المرور الجديدة */
    public function verify(VerifyCodeRequest $request): JsonResponse
    {
        $this->resolve($request->string('email')->value(), $request->string('code')->value());

        return response()->json(['message' => 'الرمز صحيح.']);
    }

    /** تعيين كلمة مرور جديدة */
    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        [$user, $record] = $this->resolve(
            $request->string('email')->value(),
            $request->string('code')->value(),
        );

        DB::transaction(function () use ($user, $record, $request): void {
            $user->update(['password' => $request->string('password')->value()]);
            $record->update(['used_at' => now()]);

            /*
             * من يملك بريد الحساب أثبت ملكيته بالرمز، فنعتبر البريد
             * مؤكَّداً هنا حتى لا يعلق في شاشة التأكيد بعد الاستعادة.
             */
            if (! $user->hasVerifiedEmail()) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            // إنهاء كل الجلسات بعد تغيير كلمة المرور
            $user->tokens()->delete();
        });

        return response()->json([
            'message' => 'تم تغيير كلمة المرور بنجاح. تم إنهاء جلساتك على جميع الأجهزة.',
        ]);
    }

    /** يرسل رمزاً إن وُجد الحساب، ويصمت إن لم يوجد */
    private function issueFor(string $email): void
    {
        $user = User::where('email', $email)->first();

        if ($user) {
            $this->codes->send($user, VerificationCode::TYPE_PASSWORD_RESET);
        }
    }

    /**
     * يتحقق من الرمز ويعيد المستخدم وسجلّ الرمز.
     *
     * @return array{0: User, 1: VerificationCode}
     */
    private function resolve(string $email, string $code): array
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            throw $this->codes->invalid();
        }

        return [$user, $this->codes->verify($user, VerificationCode::TYPE_PASSWORD_RESET, $code)];
    }
}
