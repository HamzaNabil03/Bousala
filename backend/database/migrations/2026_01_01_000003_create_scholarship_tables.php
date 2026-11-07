<?php

use App\Enums\LanguageRequirement;
use App\Enums\ScholarshipStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * المنح وجداولها الفرعية.
 * فُصلت شروط الأهلية والمستندات والمزايا في جداول مستقلة بدل حقول نصية،
 * لأن صفحة تفاصيل المنحة تعرضها كقوائم مرتّبة وتُحرَّر من لوحة الإدارة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scholarships', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title_ar');
            $table->string('title_en')->nullable();

            $table->string('provider');
            $table->string('university_name')->nullable();

            $table->string('country_code', 2);
            $table->string('country_name_ar');
            $table->string('region')->nullable();

            $table->string('funding_type');
            $table->string('language_requirement')->default(LanguageRequirement::NotRequired->value);
            $table->string('status')->default(ScholarshipStatus::Draft->value);

            $table->text('description')->nullable();
            $table->string('apply_url')->nullable();
            $table->string('cover_image_url')->nullable();
            $table->string('logo_url')->nullable();

            $table->date('open_date')->nullable();
            $table->date('deadline')->nullable();

            $table->decimal('min_gpa', 5, 2)->nullable();
            $table->decimal('gpa_scale', 5, 2)->nullable();
            $table->decimal('acceptance_rate', 5, 2)->nullable();

            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('views_count')->default(0);

            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'deadline']);
            $table->index('country_code');
            $table->index('funding_type');
            $table->index('is_featured');
        });

        Schema::create('scholarship_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->string('level');

            $table->unique(['scholarship_id', 'level']);
            $table->index('level');
        });

        Schema::create('scholarship_majors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('icon')->nullable();

            $table->index('scholarship_id');
            $table->index('name');
        });

        Schema::create('scholarship_eligibility', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->text('text');
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->index('scholarship_id');
        });

        Schema::create('scholarship_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('note')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->index('scholarship_id');
        });

        Schema::create('scholarship_benefits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scholarship_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->index('scholarship_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scholarship_benefits');
        Schema::dropIfExists('scholarship_documents');
        Schema::dropIfExists('scholarship_eligibility');
        Schema::dropIfExists('scholarship_majors');
        Schema::dropIfExists('scholarship_levels');
        Schema::dropIfExists('scholarships');
    }
};
