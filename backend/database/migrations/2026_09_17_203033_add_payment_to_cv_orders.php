<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * الخدمة اليدوية صارت مدفوعة: الطالب يحوّل ثم يرفق إشعار التحويل،
 * والمدير يقبل الطلب بعد أن يتحقّق منه.
 *
 * السعر يُجمَّد على الطلب لحظة إرساله: تعديل المدير للسعر لاحقاً
 * يجب ألا يغيّر ما اتّفق عليه طالبٌ أرسل طلبه بالسعر القديم.
 * الطلبات القائمة قبل هذه المهاجرة كانت مجانية، فسعرها صفر ودفعها مقبول.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cv_orders', function (Blueprint $table): void {
            $table->decimal('price_amount', 10, 2)->default(0)->after('request_note');
            $table->string('price_currency', 8)->default('ILS')->after('price_amount');

            $table->string('payment_status')->default('accepted')->after('price_currency');
            $table->string('receipt_file_path')->nullable()->after('payment_status');
            $table->string('receipt_file_name')->nullable()->after('receipt_file_path');
            $table->text('payment_note')->nullable()->after('receipt_file_name');
            $table->text('payment_rejection_reason')->nullable()->after('payment_note');
            $table->timestamp('payment_reviewed_at')->nullable()->after('payment_rejection_reason');
            $table->foreignId('payment_reviewed_by')
                ->nullable()
                ->after('payment_reviewed_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('cv_orders', function (Blueprint $table): void {
            $table->dropForeign(['payment_reviewed_by']);
            $table->dropIndex(['payment_status']);
            $table->dropColumn([
                'price_amount',
                'price_currency',
                'payment_status',
                'receipt_file_path',
                'receipt_file_name',
                'payment_note',
                'payment_rejection_reason',
                'payment_reviewed_at',
                'payment_reviewed_by',
            ]);
        });
    }
};
