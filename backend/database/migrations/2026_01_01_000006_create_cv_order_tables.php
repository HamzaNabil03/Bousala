<?php

use App\Enums\CvOrderStatus;
use App\Enums\TimelineStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * خدمة صياغة السيرة الذاتية: خبير بشري + فحص آلي.
 * الخدمة مجانية، لذا لا يوجد أي جدول للدفع أو الفواتير.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expert_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('title_prefix')->nullable(); // د. / أ.د
            $table->string('specialization')->nullable();
            $table->text('bio')->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        Schema::create('cv_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // MNH-CV-8921
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('expert_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default(CvOrderStatus::Draft->value);

            $table->unsignedTinyInteger('current_step')->default(1);
            $table->json('data_snapshot')->nullable();
            $table->unsignedTinyInteger('ats_score')->nullable();

            $table->timestamp('expected_delivery_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->string('final_file_path')->nullable();

            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
        });

        Schema::create('cv_order_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cv_order_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default(TimelineStatus::Pending->value);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->index('cv_order_id');
        });

        Schema::create('cv_order_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cv_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index('cv_order_id');
        });

        Schema::create('cv_ats_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cv_order_id')->constrained()->cascadeOnDelete();
            $table->text('label');
            $table->boolean('passed')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->index('cv_order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cv_ats_checks');
        Schema::dropIfExists('cv_order_notes');
        Schema::dropIfExists('cv_order_events');
        Schema::dropIfExists('cv_orders');
        Schema::dropIfExists('expert_profiles');
    }
};
