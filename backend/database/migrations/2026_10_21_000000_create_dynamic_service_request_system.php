<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_categories', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('student_services', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('service_categories')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('system_key')->nullable()->unique();
            $table->text('description');
            $table->decimal('price', 10, 2)->default(0);
            $table->string('currency', 8)->default('USD');
            $table->string('icon')->default('FileText');
            $table->string('image_path')->nullable();
            $table->unsignedSmallInteger('delivery_days')->nullable();
            $table->text('instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('service_fields', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_id')->constrained('student_services')->cascadeOnDelete();
            $table->string('key');
            $table->string('label');
            $table->string('type', 24);
            $table->string('placeholder')->nullable();
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('validation_rules')->nullable();
            $table->timestamps();
            $table->unique(['service_id', 'key']);
        });

        Schema::table('scholarships', function (Blueprint $table): void {
            $table->boolean('platform_application_enabled')->default(false)->after('is_featured');
            $table->boolean('platform_application_requests_enabled')->default(false)->after('platform_application_enabled');
            $table->decimal('platform_application_price', 10, 2)->nullable()->after('platform_application_requests_enabled');
            $table->string('platform_application_currency', 8)->default('USD')->after('platform_application_price');
            $table->text('platform_application_description')->nullable()->after('platform_application_currency');
            $table->json('platform_application_documents')->nullable()->after('platform_application_description');
        });

        Schema::create('service_requests', function (Blueprint $table): void {
            $table->id();
            $table->uuid('submission_token')->unique();
            $table->string('reference_number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('student_services')->nullOnDelete();
            $table->foreignId('scholarship_id')->nullable()->constrained()->nullOnDelete();
            $table->string('student_name');
            $table->string('student_email');
            $table->string('student_phone', 40);
            $table->text('notes')->nullable();
            $table->string('service_name_snapshot');
            $table->decimal('price_snapshot', 10, 2);
            $table->string('currency_snapshot', 8);
            $table->string('status')->default('pending_review');
            $table->string('payment_status')->default('pending_verification');
            $table->text('internal_notes')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'payment_status']);
        });

        Schema::create('service_request_responses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_field_id')->nullable()->constrained('service_fields')->nullOnDelete();
            $table->string('field_key');
            $table->string('field_label');
            $table->string('field_type', 24);
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('service_request_attachments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('kind', 32);
            $table->string('field_key')->nullable();
            $table->string('original_name');
            $table->string('path');
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
            $table->index(['service_request_id', 'kind']);
        });

        Schema::create('service_request_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event');
            $table->string('from_value')->nullable();
            $table->string('to_value')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_request_histories');
        Schema::dropIfExists('service_request_attachments');
        Schema::dropIfExists('service_request_responses');
        Schema::dropIfExists('service_requests');
        Schema::table('scholarships', function (Blueprint $table): void {
            $table->dropColumn([
                'platform_application_enabled', 'platform_application_requests_enabled',
                'platform_application_price', 'platform_application_currency',
                'platform_application_description', 'platform_application_documents',
            ]);
        });
        Schema::dropIfExists('service_fields');
        Schema::dropIfExists('student_services');
        Schema::dropIfExists('service_categories');
    }
};
