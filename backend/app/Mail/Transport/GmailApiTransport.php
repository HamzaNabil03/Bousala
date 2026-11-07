<?php

namespace App\Mail\Transport;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\Part\TextPart;

/**
 * إرسال البريد من حساب Gmail عبر واجهة Gmail API على HTTPS.
 *
 * Gmail عبر SMTP (587 أو 465) يفشل حيث تحجب الاستضافة منافذ SMTP الصادرة،
 * أما الواجهة فتعمل على المنفذ 443 الذي لا يُحجب. المصادقة بـ OAuth 2.0
 * برمز تحديث يُصدَر مرة واحدة بأمر menhity:gmail-auth — بلا كلمة مرور تطبيق.
 *
 * يرسل Gmail باسم الحساب المُخوَّل: إن اختلف MAIL_FROM_ADDRESS عنه استبدله
 * Gmail ببريد الحساب وأبقى اسم المُرسِل.
 */
class GmailApiTransport extends AbstractTransport
{
    private const ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

    public function __construct(
        private readonly GmailOAuth $oauth,
        private readonly int $timeout = 15,
    ) {
        parent::__construct();
    }

    public function __toString(): string
    {
        return 'gmail-api';
    }

    protected function doSend(SentMessage $message): void
    {
        $payload = ['raw' => $this->base64Url($this->raw($message))];

        $response = $this->post($payload, $this->oauth->accessToken());

        // رمز وصول رفضته Google قبل انتهاء مدته المخزَّنة (أُبطل مثلاً): نجدّده مرة واحدة
        if ($response->status() === 401) {
            $this->oauth->forgetAccessToken();
            $response = $this->post($payload, $this->oauth->accessToken());
        }

        if ($response->failed()) {
            $detail = $response->json('error.message') ?? 'استجابة غير متوقعة';

            throw new RuntimeException("خطأ من Gmail ({$response->status()}): {$detail}");
        }
    }

    /**
     * نص الرسالة كاملاً بصيغة RFC 5322.
     *
     * يقرأ Gmail المستلمين من الترويسات نفسها، بينما يحذف Symfony ترويسة
     * Bcc من النص المُعدّ للإرسال لأن SMTP يمرّر المستلمين في المغلّف.
     * فنعيدها هنا، ويتكفّل Gmail بإخفائها عن بقية المستلمين.
     */
    private function raw(SentMessage $message): string
    {
        $email = $message->getOriginalMessage();

        if (! $email instanceof Email || $email->getBcc() === []) {
            return $message->toString();
        }

        $headers = $email->getPreparedHeaders();
        $headers->remove('Message-ID');
        $headers->addIdHeader('Message-ID', $message->getMessageId());
        $headers->addMailboxListHeader('Bcc', $email->getBcc());

        return $headers->toString().($email->getBody() ?? new TextPart(''))->toString();
    }

    /** الترميز الذي تطلبه Gmail: base64 بأحرف آمنة للروابط وبلا حشو */
    private function base64Url(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    /** @param  array{raw: string}  $payload */
    private function post(array $payload, string $accessToken): Response
    {
        return Http::withToken($accessToken)
            ->timeout($this->timeout)
            ->asJson()
            ->post(self::ENDPOINT, $payload);
    }
}
