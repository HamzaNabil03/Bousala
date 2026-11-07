<?php

namespace App\Mail;

/**
 * يترجم نص خطأ الإرسال إلى خطوة عملية واحدة.
 *
 * يُستخدم في أمر menhity:mail-test وفي سجل الخادم عند فشل إرسال رمز
 * التحقق، فيقرأ المشرف السبب والحل في السطر نفسه بدل تفسير رسائل
 * Symfony وGoogle الخام.
 */
final class MailFailureHint
{
    /**
     * المنافذ التي يقدّمها كل مزوّد SMTP شائع.
     *
     * منفذ خارجها لا يستجيب أبداً مهما صحّ الباقي — كالمنفذ 2587 مع Gmail،
     * وهو منفذ Resend البديل الذي يسهل خلطه به.
     *
     * @var array<string, array<int, int>>
     */
    public const PROVIDER_PORTS = [
        'smtp.gmail.com' => [587, 465],
        'smtp.resend.com' => [587, 465, 2587, 2465],
        'smtp-relay.brevo.com' => [587, 465, 2525],
        'smtp.mailgun.org' => [587, 465, 2525],
        'smtp.sendgrid.net' => [587, 465, 2525, 25],
        'smtp.office365.com' => [587],
        'smtp-mail.outlook.com' => [587],
        'smtp.mail.yahoo.com' => [587, 465],
    ];

    public const HTTPS_FIX = 'الحل ناقل يعمل عبر HTTPS (المنفذ 443 لا يُحجب): MAIL_MAILER=gmail للإرسال من حساب Gmail '
        .'(اربطه بـ php artisan menhity:gmail-auth)، أو MAIL_MAILER=resend لنطاق موثَّق لدى Resend.';

    public static function for(string $error): string
    {
        return match (true) {
            str_contains($error, 'scheme is not supported') => 'قيمة MAIL_SCHEME غير مقبولة. استخدم smtp مع المنفذ 587، أو smtps مع المنفذ 465. '
                .'القيمة tls شائعة الخطأ ولا يقبلها Symfony Mailer.',

            str_contains($error, 'invalid_grant') => 'رمز التحديث GMAIL_REFRESH_TOKEN انتهى أو أُلغي. شغّل php artisan menhity:gmail-auth من جديد. '
                .'إن كانت شاشة موافقة OAuth في وضع Testing فرموزها تنتهي بعد سبعة أيام — انشرها (Publish app) لتدوم.',

            str_contains($error, 'invalid_client') || str_contains($error, 'unauthorized_client') => 'GMAIL_CLIENT_ID أو GMAIL_CLIENT_SECRET غير صحيح. '
                .'انسخهما من Google Cloud Console ← Credentials.',

            str_contains($error, 'خطأ من Gmail (403)') => 'التطبيق غير مخوَّل بالإرسال: تأكد أن Gmail API مفعَّلة في مشروع Google Cloud، '
                .'ثم أعد الربط بـ menhity:gmail-auth لمنح صلاحية gmail.send.',

            str_contains($error, 'Precondition check failed') => 'الحساب المُخوَّل ليس حساب Gmail فعّالاً (حساب Workspace بلا Gmail مثلاً). خوّل حساب Gmail عادياً.',

            str_contains($error, '535') || stripos($error, 'Username and Password not accepted') !== false => 'اسم المستخدم أو كلمة المرور مرفوضة. مع Gmail: استخدم كلمة مرور تطبيق (App Password) '
                .'من 16 محرفاً بلا مسافات، لا كلمة مرور حسابك، ويجب تفعيل التحقق بخطوتين أولاً.',

            str_contains($error, '534') => 'Gmail يطلب كلمة مرور تطبيق. فعّل التحقق بخطوتين ثم أنشئ App Password.',

            stripos($error, 'getaddrinfo') !== false => 'اسم خادم البريد غير موجود — راجع MAIL_HOST بحثاً عن خطأ إملائي.',

            stripos($error, 'Connection could not be established') !== false || stripos($error, 'timed out') !== false => self::unreachableFrom($error),

            str_contains($error, '550') || stripos($error, 'not verified') !== false || stripos($error, 'domain') !== false => 'المزوّد يرفض عنوان المُرسِل. يجب أن يكون MAIL_FROM_ADDRESS على نطاق موثَّق لديه '
                .'(أو نفس بريد الحساب مع Gmail).',

            default => 'انسخ نص الخطأ أعلاه كاملاً عند طلب المساعدة.',
        };
    }

    /** خطوة عملية لخادم SMTP لا يستجيب: يميّز المنفذ الخاطئ عن المنفذ المحجوب */
    public static function unreachable(string $host, int $port): string
    {
        $host = strtolower($host);
        $known = self::PROVIDER_PORTS[$host] ?? null;

        if ($known === null) {
            return "لم يستجب {$host} على المنفذ {$port}. تأكد من MAIL_HOST وMAIL_PORT لدى مزوّدك "
                .'(587 مع MAIL_SCHEME=smtp، أو 465 مع smtps)؛ وإن كانا صحيحين فالاستضافة تحجب منافذ SMTP الصادرة. '.self::HTTPS_FIX;
        }

        if (! in_array($port, $known, true)) {
            $note = in_array($port, [2587, 2465], true) ? ' المنفذان 2587 و2465 خاصان بـ Resend وحده.' : '';

            return "المنفذ {$port} لا يقدّمه {$host} أصلاً.{$note} المنافذ الصحيحة له: ".implode(' أو ', $known)
                .' (587 مع MAIL_SCHEME=smtp، و465 مع smtps). وإن استمر الفشل بعد التصحيح فالاستضافة تحجب SMTP — '.self::HTTPS_FIX;
        }

        return "لم يستجب {$host} على المنفذ {$port} رغم أنه منفذ صحيح: الاستضافة تحجب منافذ SMTP الصادرة على الأرجح "
            .'(Railway وRender تفعلان ذلك في الخطط المجانية). '.self::HTTPS_FIX;
    }

    private static function unreachableFrom(string $error): string
    {
        if (preg_match('/host "([^":]+):(\d+)"/', $error, $matches) === 1) {
            return self::unreachable($matches[1], (int) $matches[2]);
        }

        return 'تعذّر الوصول إلى خادم البريد. راجع MAIL_HOST وMAIL_PORT (587 مع MAIL_SCHEME=smtp، أو 465 مع smtps). '.self::HTTPS_FIX;
    }
}
