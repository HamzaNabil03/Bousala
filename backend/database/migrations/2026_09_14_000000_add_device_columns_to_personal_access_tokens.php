<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * توكن Sanctum هو "الجلسة" في بَوْصلة، فنضيف إليه بيانات الجهاز
 * ليتمكّن المستخدم من رؤية أجهزته النشطة وإنهاء أي منها.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('abilities');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->string('browser')->nullable()->after('user_agent');
            $table->string('os')->nullable()->after('browser');
            $table->string('device_type', 20)->nullable()->after('os');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['ip_address', 'user_agent', 'browser', 'os', 'device_type']);
        });
    }
};
