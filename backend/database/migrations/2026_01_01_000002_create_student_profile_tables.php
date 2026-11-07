<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * الملف الأكاديمي — المصدر الوحيد لبيانات الطالب.
 * تقرأ منه خوارزمية المطابقة وأدوات الذكاء الاصطناعي وويزرد السيرة الذاتية.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->string('full_name_ar')->nullable();
            $table->string('full_name_en')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('nationality')->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('portfolio_url')->nullable();
            $table->string('academic_email')->nullable();
            $table->text('bio')->nullable();
            $table->string('headline')->nullable();

            // نسبة اكتمال الملف (0-100) تُحتسب تلقائياً
            $table->unsignedTinyInteger('completion_percent')->default(0);

            $table->timestamps();
        });

        Schema::create('educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();

            $table->string('degree');
            $table->string('major')->nullable();
            $table->string('institution');
            $table->string('country')->nullable();
            $table->unsignedSmallInteger('graduation_year')->nullable();
            $table->boolean('is_current')->default(false);

            // المعدل ونظامه معاً — يدعم 4.0 و 5.0 والنسبة المئوية
            $table->decimal('gpa_value', 5, 2)->nullable();
            $table->decimal('gpa_scale', 5, 2)->nullable();
            $table->string('honors')->nullable();

            $table->text('thesis_title')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('student_profile_id');
        });

        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();

            $table->string('title');
            $table->string('type')->default('job');
            $table->string('organization');
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('student_profile_id');
        });

        Schema::create('profile_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['student_profile_id', 'name']);
        });

        Schema::create('profile_languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('proficiency');
            $table->string('certificate')->nullable();
            $table->timestamps();

            $table->unique(['student_profile_id', 'name']);
        });

        Schema::create('certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('issuer')->nullable();
            $table->string('credential_id')->nullable();
            $table->date('issue_date')->nullable();
            $table->string('url')->nullable();
            $table->timestamps();

            $table->index('student_profile_id');
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('url')->nullable();
            $table->timestamps();

            $table->index('student_profile_id');
        });

        Schema::create('interests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['student_profile_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interests');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('certifications');
        Schema::dropIfExists('profile_languages');
        Schema::dropIfExists('profile_skills');
        Schema::dropIfExists('experiences');
        Schema::dropIfExists('educations');
        Schema::dropIfExists('student_profiles');
    }
};
