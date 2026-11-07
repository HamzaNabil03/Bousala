<?php

namespace App\Services\Ai;

/**
 * مزوّد توليد نصوص.
 * تفصل هذه الواجهة منطق الأدوات عن المزوّد، فيمكن تبديل المزوّد
 * من ملف البيئة دون لمس منطق الأدوات ولا واجهة المستخدم.
 */
interface AiProvider
{
    /** هل المزوّد جاهز للاستخدام (مفتاحه مضبوط)؟ */
    public function isConfigured(): bool;

    /** اسم المزوّد كما يظهر في لوحة الإدارة */
    public function name(): string;

    /**
     * يولّد نصاً واحداً من تعليمات النظام ونص المستخدم.
     *
     * @throws \RuntimeException عند فشل الاتصال أو رفض المزوّد للطلب
     */
    public function generate(string $systemPrompt, string $userPrompt): string;
}
