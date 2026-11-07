<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * إعدادات يضبطها المدير من اللوحة — لا من ملفات الخادم.
 *
 * أسعار الخدمات وبيانات الحساب البنكي تتغيّر بقرار إداري لا بنشر جديد،
 * فمكانها قاعدة البيانات. القيمة json لأن كل مفتاح يحمل بنية مختلفة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
