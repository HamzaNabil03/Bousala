<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceField extends Model
{
    protected $fillable = ['service_id', 'key', 'label', 'type', 'placeholder', 'options', 'is_required', 'sort_order', 'validation_rules'];
    protected function casts(): array { return ['options' => 'array', 'is_required' => 'boolean', 'sort_order' => 'integer']; }
    public function service(): BelongsTo { return $this->belongsTo(StudentService::class, 'service_id'); }
}
