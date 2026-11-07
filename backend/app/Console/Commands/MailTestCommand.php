<?php

namespace App\Console\Commands;

use App\Mail\MailFailureHint;
use App\Mail\VerifyEmailCodeMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * تشخيص إعداد البريد من سطر الأوامر.
 *
 * يطبع الإعداد الفعّال، ويفحص منفذ SMTP قبل الإرسال إن كان هو الناقل،
 * ثم يحاول إرسال رسالة حقيقية ويعرض نص الخطأ كاملاً مع الخطوة العملية
 * المقابلة — أسرع من تتبّع السجلات عند ضبط النشر.
 */
class MailTestCommand extends Command
{
    protected $signature = 'menhity:mail-test {email : البريد المُرسَل إليه}';

    protected $description = 'يفحص إعداد البريد ويرسل رسالة تجريبية';

    /** مهلة فحص المنفذ بالثواني — كافية لأي خادم يستجيب أصلاً */
    private const PROBE_SECONDS = 5;

    public function handle(): int
    {
        $to = $this->argument('email');
        $mailer = (string) config('mail.default');

        $this->newLine();
        $this->line('<comment>الإعداد الفعّال:</comment>');
        $this->table(['المفتاح', 'القيمة'], $this->rows($mailer));

        if ($mailer === 'log') {
            $this->warn('MAIL_MAILER=log — الرسالة تُكتب في storage/logs/laravel.log ولا تُرسَل فعلياً.');
        }

        if ($mailer === 'smtp' && ! $this->smtpReachable()) {
            return self::FAILURE;
        }

        // مستخدم غير مخزَّن: الأمر تشخيصي ولا يلمس قاعدة البيانات
        $user = new User(['name' => 'اختبار بَوْصلة', 'email' => $to]);

        try {
            Mail::to($to)->send(new VerifyEmailCodeMail($user, '123456'));
        } catch (Throwable $e) {
            $this->newLine();
            $this->error('✗ فشل الإرسال');
            $this->newLine();
            $this->line('<comment>'.$e->getMessage().'</comment>');
            $this->newLine();
            $this->line(MailFailureHint::for($e->getMessage()));

            return self::FAILURE;
        }

        $this->newLine();
        $this->info("✓ تم الإرسال إلى {$to}");
        $this->line('إن لم تجد الرسالة خلال دقيقة، راجع مجلد الرسائل غير المرغوب فيها (Spam).');

        return self::SUCCESS;
    }

    /**
     * كل ناقل يقرأ مفاتيح مختلفة — نعرض ما يخصّ المضبوط فقط.
     *
     * @return array<int, array{0: string, 1: string}>
     */
    private function rows(string $mailer): array
    {
        $rows = [['MAIL_MAILER', $mailer]];

        $rows = array_merge($rows, match ($mailer) {
            'resend' => [['RESEND_API_KEY', $this->masked(config('mail.mailers.resend.key'))]],
            'gmail' => [
                ['GMAIL_CLIENT_ID', config('mail.mailers.gmail.client_id') ?: '— (غير مضبوط)'],
                ['GMAIL_CLIENT_SECRET', $this->masked(config('mail.mailers.gmail.client_secret'))],
                ['GMAIL_REFRESH_TOKEN', $this->masked(config('mail.mailers.gmail.refresh_token'))],
            ],
            'smtp' => [
                ['MAIL_HOST', config('mail.mailers.smtp.host') ?: '—'],
                ['MAIL_PORT', (string) (config('mail.mailers.smtp.port') ?: '—')],
                ['MAIL_SCHEME', config('mail.mailers.smtp.scheme') ?: '—'],
                ['MAIL_USERNAME', config('mail.mailers.smtp.username') ?: '—'],
                ['MAIL_PASSWORD', $this->masked(config('mail.mailers.smtp.password'))],
            ],
            default => [],
        });

        $from = config('mail.from.address') ?: '—';

        $rows[] = ['MAIL_FROM_ADDRESS', $mailer === 'gmail' ? "{$from} (يستبدله Gmail ببريد الحساب المُخوَّل إن اختلف)" : $from];
        $rows[] = ['MAIL_FROM_NAME', config('mail.from.name') ?: '—'];

        return $rows;
    }

    /**
     * فحص مسبق لمنفذ SMTP باتصال TCP قصير.
     *
     * يفصل بين منفذ خاطئ ومنفذ تحجبه الاستضافة قبل انتظار مهلة الإرسال
     * الكاملة، ويثبت أن HTTPS يعمل حين يكون SMTP هو المحجوب.
     */
    private function smtpReachable(): bool
    {
        $host = (string) config('mail.mailers.smtp.host');
        $port = (int) config('mail.mailers.smtp.port');

        if ($host === '' || $port === 0) {
            return true; // ندع الإرسال يعرض الخطأ الأصلي
        }

        $this->newLine();
        $this->line("→ فحص الاتصال بـ {$host}:{$port}");

        if ($this->portOpen($host, $port)) {
            $this->info('   ✓ المنفذ يستجيب');

            return true;
        }

        $this->error("✗ لا يمكن فتح اتصال إلى {$host}:{$port} خلال ".self::PROBE_SECONDS.' ثوانٍ');
        $this->newLine();

        $known = MailFailureHint::PROVIDER_PORTS[strtolower($host)] ?? [];

        if ($known === [] || in_array($port, $known, true)) {
            // المنفذ صحيح (أو المزوّد غير معروف): نثبت أن الحجب في SMTP وحده
            $httpsOpen = $this->portOpen('gmail.googleapis.com', 443) || $this->portOpen('api.resend.com', 443);

            $this->line($httpsOpen
                ? '   HTTPS (المنفذ 443) يعمل من هذا الخادم بينما SMTP لا يستجيب.'
                : '   HTTPS لا يستجيب أيضاً — الخادم بلا اتصال خارجي، أو اسم المضيف خاطئ.');
            $this->newLine();
        }

        $this->line(MailFailureHint::unreachable($host, $port));

        return false;
    }

    private function portOpen(string $host, int $port): bool
    {
        $socket = @fsockopen($host, $port, $errno, $errstr, self::PROBE_SECONDS);

        if ($socket === false) {
            return false;
        }

        fclose($socket);

        return true;
    }

    /** يُظهر طول القيمة السرّية ووجود مسافات فيها دون كشفها */
    private function masked(mixed $secret): string
    {
        $secret = (string) $secret;

        if ($secret === '') {
            return '— (غير مضبوطة)';
        }

        $note = str_contains($secret, ' ') ? ' ⚠ تحتوي مسافات' : '';

        return str_repeat('•', min(mb_strlen($secret), 24)).' ('.mb_strlen($secret).' محرفاً)'.$note;
    }
}
