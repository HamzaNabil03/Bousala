<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('phone')->nullable();

            $table->string('role')->default(UserRole::Student->value);
            $table->string('status')->default(UserStatus::Active->value);

            $table->timestamp('suspended_at')->nullable();
            $table->string('suspension_reason')->nullable();
            $table->timestamp('last_login_at')->nullable();

            // مزوّد خارجي (Google / Apple)
            $table->string('oauth_provider')->nullable();
            $table->string('oauth_id')->nullable();

            // اللغة والمنطقة
            $table->string('locale', 5)->default('ar');
            $table->string('timezone')->default('Asia/Riyadh');

            // الخصوصية والأمان
            $table->boolean('profile_visible')->default(true);
            $table->boolean('share_data_with_universities')->default(false);

            // تنبيهات البريد
            $table->boolean('notify_new_matches')->default(true);
            $table->boolean('notify_application_status')->default(true);
            $table->boolean('notify_news')->default(false);

            $table->timestamp('accepted_terms_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index(['role', 'status']);
            $table->index('created_at');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        /**
         * رموز التحقق من ستة أرقام — تُستخدم في استعادة كلمة المرور
         * وتوثيق البريد الإلكتروني.
         */
        Schema::create('verification_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // password_reset | email_verify
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_codes');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
