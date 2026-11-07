<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScholarshipDocument extends Model
{
    public $timestamps = false;

    protected $fillable = ['scholarship_id', 'name', 'note', 'sort_order'];

    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(Scholarship::class);
    }
}
