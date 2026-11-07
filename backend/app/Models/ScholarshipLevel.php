<?php

namespace App\Models;

use App\Enums\DegreeLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScholarshipLevel extends Model
{
    public $timestamps = false;

    protected $fillable = ['scholarship_id', 'level'];

    protected function casts(): array
    {
        return ['level' => DegreeLevel::class];
    }

    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(Scholarship::class);
    }
}
