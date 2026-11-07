<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * مزوّد Google Gemini عبر واجهة REST.
 *
 * الطبقة المجانية تكفي للاستخدام التجريبي، وحدودها اليومية تتغيّر —
 * راجع https://ai.google.dev/pricing قبل الاعتماد عليها في الإنتاج.
 */
class GeminiProvider implements AiProvider
{
    private const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function isConfigured(): bool
    {
        return filled(config('menhity.ai.gemini.api_key'));
    }

    public function name(): string
    {
        return 'Google Gemini';
    }

    public function generate(string $systemPrompt, string $userPrompt): string
    {
        $model = config('menhity.ai.gemini.model');

        $response = Http::withHeaders(['x-goog-api-key' => config('menhity.ai.gemini.api_key')])
            ->timeout(config('menhity.ai.timeout'))
            ->asJson()
            ->post(self::BASE_URL."/{$model}:generateContent", [
                'system_instruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents' => [
                    ['role' => 'user', 'parts' => [['text' => $userPrompt]]],
                ],
                'generationConfig' => [
                    'maxOutputTokens' => config('menhity.ai.max_tokens'),
                    'temperature' => 0.7,
                    'responseMimeType' => 'application/json',
                ],
            ]);

        if ($response->failed()) {
            $detail = $response->json('error.message') ?? 'استجابة غير متوقعة';

            throw new RuntimeException("خطأ من Gemini ({$response->status()}): {$detail}");
        }

        $payload = $response->json();

        // الطلب قد يُرفض قبل التوليد أصلاً (فلاتر المحتوى)
        if ($blockReason = data_get($payload, 'promptFeedback.blockReason')) {
            throw new RuntimeException("رفض المزوّد معالجة الطلب ({$blockReason}).");
        }

        $candidate = data_get($payload, 'candidates.0');

        if (! $candidate) {
            throw new RuntimeException('لم يُعِد المزوّد أي نتيجة.');
        }

        $finishReason = data_get($candidate, 'finishReason');

        if ($finishReason === 'SAFETY' || $finishReason === 'PROHIBITED_CONTENT') {
            throw new RuntimeException('تعذّر إنتاج المحتوى لهذا الطلب.');
        }

        // النص قد يأتي موزّعاً على عدة أجزاء
        $text = collect(data_get($candidate, 'content.parts', []))
            ->pluck('text')
            ->filter()
            ->implode("\n");

        if (blank($text)) {
            throw new RuntimeException('أعاد المزوّد نتيجة فارغة.');
        }

        // القطع بسبب سقف المخرجات يُنبَّه عليه بدل تمريره كأنه نص مكتمل
        if ($finishReason === 'MAX_TOKENS') {
            $text .= "\n\n— انقطع النص عند الحد الأقصى للمخرجات —";
        }

        return trim($text);
    }
}
