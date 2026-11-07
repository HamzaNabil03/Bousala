<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiTool extends Model
{
    protected $fillable = ['key', 'name_ar', 'description', 'icon', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function getRouteKeyName(): string
    {
        return 'key';
    }

    public function runs(): HasMany
    {
        return $this->hasMany(AiToolRun::class);
    }
}
