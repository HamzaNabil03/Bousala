<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * حسابات التشغيل المبدئية كانت تحمل أسماء أشخاص، وهي حسابات نظام يتشاركها
 * الفريق — فاسم شخص عليها يضلّل من يقرأ سجلّ الإجراءات.
 *
 * التغيير مقيَّد بالاسم القديم: من أعاد تسمية حسابه لا يُمسّ.
 */
return new class extends Migration
{
    private const ACCOUNTS = [
        'admin@menhity.com' => ['from' => 'أحمد محمد', 'to' => 'Admin'],
        'moderator@menhity.com' => ['from' => 'عمر السعيد', 'to' => 'Moderator'],
        'expert@menhity.com' => ['from' => 'عبد الرحمن النجار', 'to' => 'Expert'],
        'student@menhity.com' => ['from' => 'أحمد عبدالله', 'to' => 'Student'],
    ];

    public function up(): void
    {
        foreach (self::ACCOUNTS as $email => $names) {
            DB::table('users')
                ->where('email', $email)
                ->where('name', $names['from'])
                ->update(['name' => $names['to']]);
        }
    }

    public function down(): void
    {
        foreach (self::ACCOUNTS as $email => $names) {
            DB::table('users')
                ->where('email', $email)
                ->where('name', $names['to'])
                ->update(['name' => $names['from']]);
        }
    }
};
