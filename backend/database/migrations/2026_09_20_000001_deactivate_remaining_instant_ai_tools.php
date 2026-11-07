<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * لا مسار ذكاء اصطناعي فوري إطلاقاً: الخدمة الوحيدة لتجهيز السيرة
 * الذاتية وخطاب الدافع صارت الخدمة اليدوية بإشراف خبير من فريق بَوْصلة.
 * سبق تعطيل «cv-builder» وحدها؛ الآن البقية أيضاً.
 *
 * تعطيل لا حذف: تبقى سجلّات الاستخدام السابقة في التقارير، وتبقى
 * الأدوات قابلة لإعادة التفعيل من لوحة الإدارة إن احتيج لها لاحقاً.
 */
return new class extends Migration
{
    private const KEYS = ['cv-enhancer', 'letter-builder', 'letter-enhancer', 'profile-review'];

    public function up(): void
    {
        DB::table('ai_tools')->whereIn('key', self::KEYS)->update(['is_active' => false]);
    }

    public function down(): void
    {
        DB::table('ai_tools')->whereIn('key', self::KEYS)->update(['is_active' => true]);
    }
};
