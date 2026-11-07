<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * مزوّد Cloudflare Workers AI عبر واجهة REST.
 *
 * يعمل ضمن الحصة اليومية المجانية لحسابات Cloudflare، ولا يتطلّب بطاقة دفع،
 * ولا يفرض قيوداً جغرافية — راجع https://developers.cloudflare.com/workers-ai/
 * لحدود الاستخدام وقائمة النماذج المتاحة.
 */
class CloudflareProvider implements AiProvider
{
    private const BASE_URL = 'https://api.cloudflare.com/client/v4/accounts';

    public function isConfigured(): bool
    {
        return filled(config('menhity.ai.cloudflare.account_id'))
            && filled(config('menhity.ai.cloudflare.api_token'));
    }

    public function name(): string
    {
        return 'Cloudflare Workers AI';
    }

    public function generate(string $systemPrompt, string $userPrompt): string
    {
        $accountId = config('menhity.ai.cloudflare.account_id');
        $model = config('menhity.ai.cloudflare.model');

        $response = Http::withToken(config('menhity.ai.cloudflare.api_token'))
            ->timeout(config('menhity.ai.timeout'))
            ->asJson()
            ->post(self::BASE_URL."/{$accountId}/ai/run/{$model}", [
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'max_tokens' => config('menhity.ai.max_tokens'),
                'temperature' => 0.7,
            ]);

        if ($response->failed()) {
            throw new RuntimeException(
                "خطأ من Cloudflare ({$response->status()}): ".$this->errorDetail($response->json()),
            );
        }

        $payload = $response->json();

        // Cloudflare قد يعيد 200 مع success=false، فلا يكفي فحص رمز الحالة
        if (data_get($payload, 'success') === false) {
            throw new RuntimeException('خطأ من Cloudflare: '.$this->errorDetail($payload));
        }

        $text = $this->textValue(data_get($payload, 'result.response'));

        // بعض النماذج تعيد المخرجات بصيغة المحادثة بدل حقل response المباشر
        if (blank($text)) {
            $text = $this->textValue(data_get($payload, 'result.choices.0.message.content'));
        }

        if (blank($text)) {
            throw new RuntimeException('أعاد المزوّد نتيجة فارغة.');
        }

        return trim($text);
    }

    /** يحوّل صيغ المخرجات النصية المختلفة إلى نص واحد قبل معالجته. */
    private function textValue(mixed $value): ?string
    {
        if (is_string($value)) {
            return $value;
        }

        if (! is_array($value)) {
            return null;
        }

        if (array_key_exists('valid', $value) && array_key_exists('document_class', $value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        }

        foreach (['response', 'text', 'generated_text', 'content'] as $key) {
            if (array_key_exists($key, $value)) {
                $text = $this->textValue($value[$key]);
                if (filled($text)) {
                    return $text;
                }
            }
        }

        $parts = array_map(fn ($part) => $this->textValue($part), $value);
        $parts = array_values(array_filter($parts, fn ($part) => filled($part)));

        return $parts ? implode("\n", $parts) : null;
    }

    /**
     * رسائل أخطاء Cloudflare تأتي في مصفوفة errors — نجمعها في سطر واحد.
     *
     * @param  array<array-key, mixed>|null  $payload
     */
    private function errorDetail(?array $payload): string
    {
        $messages = collect(data_get($payload, 'errors', []))
            ->map(function ($error): string {
                $message = trim((string) data_get($error, 'message'));
                $code = data_get($error, 'code');

                return $code ? trim("{$message} ({$code})") : $message;
            })
            ->filter();

        return $messages->isNotEmpty() ? $messages->implode(' — ') : 'استجابة غير متوقعة';
    }
}
