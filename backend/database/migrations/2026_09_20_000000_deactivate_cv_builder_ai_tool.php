<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * أداة الذكاء الاصطناعي «إنشاء السيرة الذاتية» كانت مضلِّلة: بطاقتها في
 * القسم «الفوري» توحي بأنها مسار مستقل سريع، لكنها كانت تفتح فعلياً نفس
 * ويزرد «كتابة سيرة ذاتية من الصفر» المدفوع الذي يعمل عليه الفريق —
 * فيظهر الخيار مكرَّراً بلا داعٍ. الكتابة من الصفر صارت مقصورة على
 * المسار اليدوي وحده.
 *
 * التعطيل لا الحذف: تبقى سجلّات الاستخدام السابقة لهذه الأداة في
 * التقارير، وتبقى قابلة لإعادة التفعيل من لوحة الإدارة إن احتيج لاحقاً.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('ai_tools')->where('key', 'cv-builder')->update(['is_active' => false]);
    }

    public function down(): void
    {
        DB::table('ai_tools')->where('key', 'cv-builder')->update(['is_active' => true]);
    }
};
