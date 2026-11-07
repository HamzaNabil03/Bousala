<?php

namespace App\Models;

use App\Enums\TimelineStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CvOrderEvent extends Model
{
    protected $fillable = ['cv_order_id', 'title', 'description', 'status', 'sort_order', 'occurred_at'];

    protected function casts(): array
    {
        return [
            'status' => TimelineStatus::class,
            'occurred_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CvOrder::class, 'cv_order_id');
    }
}
