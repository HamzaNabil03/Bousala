<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * تأكيد البريد صار شرطاً للدخول، والحسابات المنشأة قبل هذا التغيير
 * لم تمرّ بالخطوة أصلاً. نعتبرها مؤكَّدة حتى لا تُحجب عن أصحابها،
 * ويسري الشرط على الحسابات الجديدة وحدها.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        // لا رجعة: لا نملك تمييز ما كان مؤكَّداً قبل التعبئة عمّا عُبِّئ هنا.
    }
};
