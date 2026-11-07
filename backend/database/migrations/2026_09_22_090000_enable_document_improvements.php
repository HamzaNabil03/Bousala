<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['cv-enhancer' => 'تحسين السيرة بالذكاء الاصطناعي', 'letter-enhancer' => 'تحسين الخطاب بالذكاء الاصطناعي'] as $key => $name) {
            DB::table('ai_tools')->updateOrInsert(['key' => $key], [
                'name_ar' => $name, 'description' => 'رفع ملف ومراجعة الأخطاء وتنزيل نسخة محسّنة',
                'is_active' => true, 'sort_order' => 0, 'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('ai_tools')->whereIn('key', ['cv-enhancer', 'letter-enhancer'])->update(['is_active' => false]);
    }
};
