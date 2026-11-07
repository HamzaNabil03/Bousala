<?php

namespace App\Services\Ai;

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIStatusException;
use RuntimeException;

/** مزوّد Anthropic Claude عبر الحزمة الرسمية. */
class ClaudeProvider implements AiProvider
{
    public function isConfigured(): bool
    {
        return filled(config('menhity.ai.anthropic.api_key'));
    }

    public function name(): string
    {
        return 'Anthropic Claude';
    }

    public function generate(string $systemPrompt, string $userPrompt): string
    {
        $client = new Client(apiKey: config('menhity.ai.anthropic.api_key'));

        try {
            $message = $client->messages->create(
                model: config('menhity.ai.anthropic.model'),
                maxTokens: config('menhity.ai.max_tokens'),
                system: [
                    ['type' => 'text', 'text' => $systemPrompt],
                ],
                thinking: ['type' => 'adaptive'],
                messages: [
                    ['role' => 'user', 'content' => $userPrompt],
                ],
            );
        } catch (APIStatusException $e) {
            throw new RuntimeException('خطأ من Claude: '.($e->type?->value ?? $e->getMessage()), previous: $e);
        }

        if ($message->stopReason === 'refusal') {
            throw new RuntimeException('تعذّر إنتاج المحتوى لهذا الطلب.');
        }

        $text = '';

        foreach ($message->content as $block) {
            if ($block->type === 'text') {
                $text .= $block->text."\n";
            }
        }

        if (blank(trim($text))) {
            throw new RuntimeException('أعاد المزوّد نتيجة فارغة.');
        }

        return trim($text);
    }
}
