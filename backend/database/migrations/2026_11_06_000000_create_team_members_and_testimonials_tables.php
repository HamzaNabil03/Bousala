<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_members', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 160);
            $table->string('role', 160);
            $table->text('biography')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('github_url')->nullable();
            $table->string('facebook_url')->nullable();
            $table->string('email')->nullable();
            $table->unsignedInteger('display_order')->default(0)->index();
            $table->boolean('is_visible')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('testimonials', function (Blueprint $table): void {
            $table->id();
            $table->string('student_name', 160);
            $table->string('student_description', 180)->nullable();
            $table->text('feedback_text');
            $table->string('student_photo_path')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->foreignId('related_service_id')->nullable()->constrained('student_services')->nullOnDelete();
            $table->unsignedInteger('display_order')->default(0)->index();
            $table->boolean('is_published')->default(false)->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
        Schema::dropIfExists('team_members');
    }
};
