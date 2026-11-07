<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CvOrderNote extends Model
{
    protected $fillable = ['cv_order_id', 'author_id', 'body'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(CvOrder::class, 'cv_order_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
