<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentService extends Model
{
    protected $fillable = ['category_id', 'name', 'slug', 'system_key', 'description', 'price', 'currency', 'icon', 'image_path', 'delivery_days', 'instructions', 'is_active', 'sort_order'];
    protected function casts(): array { return ['price' => 'decimal:2', 'is_active' => 'boolean', 'sort_order' => 'integer', 'delivery_days' => 'integer']; }
    public function getRouteKeyName(): string { return 'slug'; }
    public function category(): BelongsTo { return $this->belongsTo(ServiceCategory::class, 'category_id'); }
    public function fields(): HasMany { return $this->hasMany(ServiceField::class, 'service_id')->orderBy('sort_order'); }
    public function requests(): HasMany { return $this->hasMany(ServiceRequest::class, 'service_id'); }
    public function scopeVisible(Builder $query): Builder { return $query->where('is_active', true)->orderBy('sort_order'); }
}
