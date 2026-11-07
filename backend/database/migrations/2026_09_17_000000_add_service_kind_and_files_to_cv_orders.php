<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * الخدمة اليدوية تحتاج طرفي الملف: ما يرفعه الطالب وما يسلّمه الفريق.
 * الطلبات السابقة كلها كتابة من الصفر، وهو الافتراضي.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cv_orders', function (Blueprint $table): void {
            $table->string('kind')->default('cv_build')->after('user_id');
            $table->string('source_file_path')->nullable()->after('kind');
            $table->string('source_file_name')->nullable()->after('source_file_path');
            $table->string('final_file_name')->nullable()->after('final_file_path');
            $table->text('request_note')->nullable()->after('final_file_name');
        });
    }

    public function down(): void
    {
        Schema::table('cv_orders', function (Blueprint $table): void {
            $table->dropColumn([
                'kind', 'source_file_path', 'source_file_name', 'final_file_name', 'request_note',
            ]);
        });
    }
};
