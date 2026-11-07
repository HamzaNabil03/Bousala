<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScholarshipMatch extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'scholarship_id', 'score', 'reasons', 'computed_at'];

    protected function casts(): array
    {
        return [
            'reasons' => 'array',
            'score' => 'integer',
            'computed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(Scholarship::class);
    }
}
