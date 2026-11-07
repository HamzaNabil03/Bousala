<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** إعداد يضبطه المدير من اللوحة — القيمة json لأن كل مفتاح يحمل بنية مختلفة */
class AppSetting extends Model
{
    protected $fillable = ['key', 'value'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }
}
