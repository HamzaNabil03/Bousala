<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * حذف الطلب من لوحة الإدارة حذفٌ ناعم.
 *
 * الطلب المدفوع سجلٌّ ماليّ: مالٌ وصل الحساب وإشعارٌ يثبته. محوُه من
 * القاعدة يمحو الإثبات معه، فلو راجع الطالب بعد شهر لم يبقَ ما يُرجَع
 * إليه. لذا يُخفى الطلب عن الطرفين ويبقى سجلّه ومرفقاته كما هي، مع سبب
 * الحذف ومَن حذفه ومتى.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cv_orders', function (Blueprint $table) {
            $table->softDeletes();
            $table->string('deletion_reason', 500)->nullable()->after('deleted_at');
            $table->foreignId('deleted_by')->nullable()->after('deletion_reason')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cv_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('deleted_by');
            $table->dropColumn(['deleted_at', 'deletion_reason']);
        });
    }
};
