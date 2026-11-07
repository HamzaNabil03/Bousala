<?php

namespace App\Services;

use App\Mail\MailFailureHint;
use App\Mail\PasswordResetCodeMail;
use App\Mail\VerifyEmailCodeMail;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * إصدار رموز التحقق من ستة أرقام والتحقق منها.
 *
 * يخدم مسارين: تأكيد البريد بعد التسجيل، واستعادة كلمة المرور.
 * الرمز يُخزَّن مُجزَّأً (hash) فلا يمكن استخراجه من قاعدة البيانات.
 */
class VerificationCodeService
{
    public const TTL_MINUTES = 15;

    /** رابط التفعيل يُفتح من صندوق البريد، وقد لا يُفتح فوراً */
    public const ACTIVATION_TTL_HOURS = 48;

    public const MAX_ATTEMPTS = 5;

    /**
     * ينشئ رمزاً جديداً، يلغي السابق، ويرسله بالبريد.
     *
     * فشل الإرسال لا يُسقط العملية المستدعية — الحساب يبقى قائماً
     * ويستطيع المستخدم طلب رمز جديد، والخطأ يُسجَّل للمشرف.
     *
     * @return bool هل سُلِّمت الرسالة إلى الناقل — false يعني أن الرمز لن يصل
     */
    public function send(User $user, string $type): bool
    {
        $mailable = match ($type) {
            VerificationCode::TYPE_EMAIL_VERIFY => new VerifyEmailCodeMail(
                $user,
                $this->activationUrl($user, $this->issueActivationToken($user)),
            ),
            VerificationCode::TYPE_PASSWORD_RESET => new PasswordResetCodeMail(
                $user,
                $this->issue($user, VerificationCode::TYPE_PASSWORD_RESET),
            ),
            default => null,
        };

        if (! $mailable) {
            return false;
        }

        try {
            Mail::to($user->email)->send($mailable);
        } catch (Throwable $e) {
            Log::error('تعذّر إرسال رمز التحقق بالبريد', [
                'user_id' => $user->id,
                'type' => $type,
                // الناقل المستخدم فعلياً — يميّز خطأ الإعداد عن خطأ المزوّد
                'mailer' => config('mail.default'),
                'error' => $e->getMessage(),
                // الخطوة العملية المقابلة للخطأ، فتُقرأ من السجل مباشرة
                'hint' => MailFailureHint::for($e->getMessage()),
            ]);

            return false;
        }

        return true;
    }

    /** ينشئ رمزاً جديداً ويلغي الرموز السابقة من النوع نفسه */
    /**
     * رمز تفعيل طويل يُمرَّر في رابط، لا رقم يُكتب بالي.
     * طوله يجعل تخمينه غير عملي، فلا حاجة لعدّاد محاولات عليه.
     */
    public function issueActivationToken(User $user): string
    {
        $token = Str::random(64);

        $user->verificationCodes()
            ->where('type', VerificationCode::TYPE_EMAIL_VERIFY)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $user->verificationCodes()->create([
            'type' => VerificationCode::TYPE_EMAIL_VERIFY,
            'code_hash' => Hash::make($token),
            'expires_at' => now()->addHours(self::ACTIVATION_TTL_HOURS),
        ]);

        return $token;
    }

    /** الرابط الذي يضغطه المستخدم في رسالة التفعيل */
    public function activationUrl(User $user, string $token): string
    {
        return rtrim(config('menhity.frontend_url'), '/').'/verify-email?'.http_build_query([
            'token' => $token,
            'email' => $user->email,
        ]);
    }

    public function issue(User $user, string $type): string
    {
        $code = (string) random_int(100000, 999999);

        $user->verificationCodes()
            ->where('type', $type)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $user->verificationCodes()->create([
            'type' => $type,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
        ]);

        return $code;
    }

    /**
     * يتحقق من رمز مستخدم بعينه ويعيد سجلّه.
     *
     * @throws ValidationException
     */
    /**
     * يتحقّق من رمز التفعيل المُمرَّر في الرابط.
     *
     * @throws ValidationException
     */
    public function verifyActivationToken(User $user, string $token): VerificationCode
    {
        $record = $user->verificationCodes()
            ->where('type', VerificationCode::TYPE_EMAIL_VERIFY)
            ->whereNull('used_at')
            ->latest()
            ->first();

        $invalid = fn () => ValidationException::withMessages([
            'token' => 'رابط التفعيل غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً.',
        ]);

        if (! $record || $record->isExpired() || ! Hash::check($token, $record->code_hash)) {
            throw $invalid();
        }

        return $record;
    }

    public function verify(User $user, string $type, string $code): VerificationCode
    {
        $record = $user->verificationCodes()
            ->where('type', $type)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (! $record || $record->isExpired()) {
            throw $this->invalid('انتهت صلاحية الرمز. اطلب رمزاً جديداً.');
        }

        if ($record->attempts >= self::MAX_ATTEMPTS) {
            throw $this->invalid('تجاوزت عدد المحاولات المسموح بها. اطلب رمزاً جديداً.');
        }

        if (! Hash::check($code, $record->code_hash)) {
            $record->increment('attempts');

            throw $this->invalid('الرمز غير صحيح. تحقّق من بريدك وحاول مجدداً.');
        }

        return $record;
    }

    /** رسالة موحّدة حتى لا يُستدلّ منها على وجود الحساب */
    public function invalid(
        string $message = 'الرمز غير صحيح أو منتهي الصلاحية.',
        string $key = 'code',
    ): ValidationException {
        return ValidationException::withMessages([$key => $message]);
    }
}
