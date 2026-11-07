<?php

namespace App\Console\Commands;

use App\Mail\MailFailureHint;
use App\Mail\Transport\GmailOAuth;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Throwable;

/**
 * ربط حساب Gmail بالمنصّة مرة واحدة.
 *
 * يفتح المستخدم رابط موافقة Google في متصفحه، فتعيده Google إلى عنوان
 * محلي (127.0.0.1) يستقبله هذا الأمر ويبدّل رمز الموافقة برمز تحديث
 * دائم يُوضع في GMAIL_REFRESH_TOKEN على الخادم.
 *
 * يُشغَّل على جهاز المطوّر لا على الخادم. وحين لا يصل المتصفح إلى
 * الطرفية (WSL أو جهاز آخر) يقبل الأمر لصق الرابط الذي انتقل إليه المتصفح.
 */
class GmailAuthCommand extends Command
{
    protected $signature = 'menhity:gmail-auth
        {--client-id= : معرّف عميل OAuth (وإلا قُرئ من GMAIL_CLIENT_ID)}
        {--client-secret= : سرّ العميل (وإلا قُرئ من GMAIL_CLIENT_SECRET)}
        {--port=0 : المنفذ المحلي لاستقبال الموافقة، و0 يختاره تلقائياً}
        {--manual : بلا استقبال محلي — الصق الرابط الذي انتقل إليه المتصفح}';

    protected $description = 'يربط حساب Gmail بالمنصّة ويطبع متغيّرات MAIL_MAILER=gmail';

    /** كم ننتظر عودة المتصفح قبل عرض الإدخال اليدوي */
    private const WAIT_SECONDS = 300;

    /** منفذ الوضع اليدوي — لا يُفتح فعلياً، لكنه جزء من الرابط الذي تعيد إليه Google */
    private const MANUAL_PORT = 8765;

    public function handle(): int
    {
        $clientId = trim((string) ($this->option('client-id') ?: config('mail.mailers.gmail.client_id')));
        $clientSecret = trim((string) ($this->option('client-secret') ?: config('mail.mailers.gmail.client_secret')));

        if ($clientId === '') {
            $clientId = trim((string) $this->ask('GMAIL_CLIENT_ID (من Google Cloud Console ← Credentials)'));
        }

        if ($clientSecret === '') {
            $clientSecret = trim((string) $this->secret('GMAIL_CLIENT_SECRET'));
        }

        if ($clientId === '' || $clientSecret === '') {
            $this->error('معرّف العميل وسرّه مطلوبان. أنشئهما من Google Cloud Console ← Credentials ← OAuth client ID (نوع Desktop app).');

            return self::FAILURE;
        }

        $oauth = new GmailOAuth($clientId, $clientSecret);
        $state = Str::random(32);

        $server = $this->option('manual') ? null : $this->listen((int) $this->option('port'));
        $port = $server ? $this->portOf($server) : ((int) $this->option('port') ?: self::MANUAL_PORT);
        $redirectUri = "http://127.0.0.1:{$port}";

        $this->newLine();
        $this->line('<comment>افتح هذا الرابط في متصفحك وسجّل الدخول بحساب Gmail الذي سترسل منه المنصّة:</comment>');
        $this->newLine();
        $this->line($oauth->authorizationUrl($redirectUri, $state));
        $this->newLine();
        $this->line('إن ظهرت شاشة «Google hasn\'t verified this app» فاضغط Advanced ثم Go to … — فالتطبيق تطبيقك أنت.');

        $code = $server ? $this->waitForCode($server, $state) : null;

        if ($server) {
            fclose($server);
        }

        if ($code === false) {
            return self::FAILURE;
        }

        if ($code === null) {
            $this->newLine();
            $pasted = (string) $this->ask('الصق الرابط الكامل الذي انتقل إليه المتصفح بعد الموافقة (يبدأ بـ http://127.0.0.1)');
            $code = GmailOAuth::codeFromRedirect($pasted);
        }

        if ($code === null) {
            $this->error('لم أجد رمز الموافقة. أعد تشغيل الأمر وحاول مجدداً.');

            return self::FAILURE;
        }

        try {
            $result = $oauth->exchangeCode($code, $redirectUri);
        } catch (Throwable $e) {
            $this->error('✗ '.$e->getMessage());
            $this->line(MailFailureHint::for($e->getMessage()));

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('✓ تم ربط الحساب'.($result['email'] ? " {$result['email']}" : ''));
        $this->newLine();
        $this->line('<comment>أضف هذه المتغيّرات إلى لوحة الاستضافة (Variables) ثم أعد النشر:</comment>');
        $this->newLine();

        $variables = [
            'MAIL_MAILER' => 'gmail',
            'GMAIL_CLIENT_ID' => $clientId,
            'GMAIL_CLIENT_SECRET' => $clientSecret,
            'GMAIL_REFRESH_TOKEN' => $result['refresh_token'],
            'MAIL_FROM_ADDRESS' => $result['email'] ?? '<بريد حساب Gmail الذي خوّلته>',
            'MAIL_FROM_NAME' => config('app.name', 'بَوْصلة'),
        ];

        foreach ($variables as $key => $value) {
            $this->line("{$key}={$value}");
        }

        $this->newLine();
        $this->line('ثم تحقّق بـ: php artisan menhity:mail-test <بريدك>');
        $this->line('تنبيه: إن كانت شاشة موافقة OAuth في وضع Testing فالرمز ينتهي بعد سبعة أيام — انشرها (Publish app) ليدوم.');

        return self::SUCCESS;
    }

    /** @return resource|null */
    private function listen(int $port)
    {
        $server = @stream_socket_server("tcp://127.0.0.1:{$port}", $errno, $errstr);

        if ($server === false) {
            $this->warn("تعذّر فتح منفذ محلي ({$errstr}) — سننتقل إلى الوضع اليدوي.");

            return null;
        }

        return $server;
    }

    /** @param  resource  $server */
    private function portOf($server): int
    {
        $name = (string) stream_socket_get_name($server, false); // 127.0.0.1:54321

        return (int) substr($name, strrpos($name, ':') + 1);
    }

    /**
     * ينتظر عودة المتصفح من Google ويستخرج رمز الموافقة من الطلب.
     *
     * يعيد null عند انتهاء المهلة (فننتقل إلى اللصق اليدوي)، وfalse حين
     * رُفضت الموافقة صراحةً.
     *
     * @param  resource  $server
     */
    private function waitForCode($server, string $state): string|false|null
    {
        $this->newLine();
        $this->line('بانتظار عودة المتصفح… (حتى '.(self::WAIT_SECONDS / 60).' دقائق، ثم يمكنك لصق الرابط يدوياً)');

        $deadline = time() + self::WAIT_SECONDS;

        while (time() < $deadline) {
            $connection = @stream_socket_accept($server, 1);

            if ($connection === false) {
                continue;
            }

            $query = $this->queryOf($connection);

            if (! isset($query['code']) && ! isset($query['error'])) {
                $this->respond($connection, 404, 'لا شيء هنا.');

                continue;
            }

            if (($query['state'] ?? null) !== $state) {
                $this->respond($connection, 400, 'طلب غير متطابق — أعد تشغيل الأمر.');

                continue;
            }

            if (isset($query['error'])) {
                $this->respond($connection, 200, 'لم تُمنح الموافقة. يمكنك إغلاق النافذة والمحاولة مجدداً.');
                $this->error("لم تُمنح الموافقة: {$query['error']}");

                return false;
            }

            $this->respond($connection, 200, 'تم ربط حساب Gmail ببَوْصلة ✓ — يمكنك إغلاق هذه النافذة والعودة إلى الطرفية.');

            return $query['code'];
        }

        return null;
    }

    /**
     * معاملات الاستعلام من سطر الطلب الأول: GET /?code=…&state=… HTTP/1.1
     *
     * @param  resource  $connection
     * @return array<string, string>
     */
    private function queryOf($connection): array
    {
        stream_set_timeout($connection, 5);
        $requestLine = (string) fgets($connection);

        // نستهلك بقية الترويسات حتى لا يُغلق الاتصال قبل أن يقرأ المتصفح الردّ
        while (($line = fgets($connection)) !== false && trim($line) !== '') {
        }

        $path = explode(' ', $requestLine)[1] ?? '/';
        parse_str((string) parse_url($path, PHP_URL_QUERY), $query);

        return array_map(fn ($value) => is_string($value) ? $value : '', $query);
    }

    /** @param  resource  $connection */
    private function respond($connection, int $status, string $text): void
    {
        $reason = [200 => 'OK', 400 => 'Bad Request', 404 => 'Not Found'][$status] ?? 'OK';
        $body = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بَوْصلة</title></head>'
            .'<body style="font-family:sans-serif;display:grid;place-items:center;min-height:90vh;font-size:1.25rem">'
            .'<p>'.htmlspecialchars($text, ENT_QUOTES, 'UTF-8').'</p></body></html>';

        fwrite(
            $connection,
            "HTTP/1.1 {$status} {$reason}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: ".strlen($body)
            ."\r\nConnection: close\r\n\r\n{$body}",
        );
        fclose($connection);
    }
}
