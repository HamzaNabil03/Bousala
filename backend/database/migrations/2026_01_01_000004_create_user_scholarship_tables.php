<?php

use App\Enums\ApplicationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_scholarships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'scholarship_id']);
            $table->index('user_id');
        });

        /**
         * نتيجة المطابقة المحسوبة وأسبابها.
         * تُخزَّن الأسباب لتُعرض تحت "لماذا تناسبني؟" دون إعادة الحساب.
         */
        Schema::create('scholarship_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('score');
            $table->json('reasons')->nullable();
            $table->timestamp('computed_at')->useCurrent();

            $table->unique(['user_id', 'scholarship_id']);
            $table->index(['user_id', 'score']);
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default(ApplicationStatus::Planned->value);
            $table->text('notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'scholarship_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
        Schema::dropIfExists('scholarship_matches');
        Schema::dropIfExists('saved_scholarships');
    }
};
