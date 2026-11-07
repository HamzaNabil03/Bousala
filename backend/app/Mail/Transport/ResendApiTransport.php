<?php

namespace App\Mail\Transport;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

/**
 * إرسال البريد عبر واجهة Resend عبر HTTPS بدل SMTP.
 *
 * تحجب أغلب الاستضافات منافذ SMTP الصادرة (25 و465 و587) لمنع السبام،
 * فيفشل الإرسال بمهلة اتصال. المنفذ 443 لا يُحجب أبداً لأنه منفذ الويب،
 * فهذا الناقل يعمل حيث يفشل SMTP.
 */
class ResendApiTransport extends AbstractTransport
{
    private const ENDPOINT = 'https://api.resend.com/emails';

    public function __construct(
        private readonly string $apiKey,
        private readonly int $timeout = 15,
    ) {
        parent::__construct();
    }

    public function __toString(): string
    {
        return 'resend-api';
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $payload = array_filter([
            'from' => $this->addresses($email->getFrom())[0] ?? null,
            'to' => $this->addresses($email->getTo()),
            'cc' => $this->addresses($email->getCc()),
            'bcc' => $this->addresses($email->getBcc()),
            'reply_to' => $this->addresses($email->getReplyTo()),
            'subject' => $email->getSubject(),
            'html' => $email->getHtmlBody(),
            'text' => $email->getTextBody(),
        ]);

        $response = Http::withToken($this->apiKey)
            ->timeout($this->timeout)
            ->asJson()
            ->post(self::ENDPOINT, $payload);

        if ($response->failed()) {
            $detail = $response->json('message') ?? 'استجابة غير متوقعة';

            throw new \RuntimeException("خطأ من Resend ({$response->status()}): {$detail}");
        }
    }

    /**
     * @param  array<int, Address>  $addresses
     * @return array<int, string>
     */
    private function addresses(array $addresses): array
    {
        return array_map(fn (Address $address) => $address->toString(), $addresses);
    }
}
