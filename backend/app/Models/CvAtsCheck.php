<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CvAtsCheck extends Model
{
    public $timestamps = false;

    protected $fillable = ['cv_order_id', 'label', 'passed', 'sort_order'];

    protected function casts(): array
    {
        return ['passed' => 'boolean'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CvOrder::class, 'cv_order_id');
    }
}
