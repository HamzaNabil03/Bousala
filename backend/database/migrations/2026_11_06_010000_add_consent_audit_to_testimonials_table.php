<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('testimonials', function (Blueprint $table): void {
            $table->foreignId('consent_confirmed_by')->nullable()->after('published_at')->constrained('users')->nullOnDelete();
            $table->timestamp('consent_confirmed_at')->nullable()->after('consent_confirmed_by')->index();
        });
    }

    public function down(): void
    {
        Schema::table('testimonials', function (Blueprint $table): void {
            $table->dropForeign(['consent_confirmed_by']);
            $table->dropColumn(['consent_confirmed_by', 'consent_confirmed_at']);
        });
    }
};
