<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScholarshipEligibility extends Model
{
    // الاسم مفرد في قاعدة البيانات، فلا نترك Laravel يجمعه تلقائياً
    protected $table = 'scholarship_eligibility';

    public $timestamps = false;

    protected $fillable = ['scholarship_id', 'text', 'sort_order'];

    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(Scholarship::class);
    }
}
