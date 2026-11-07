<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TeamMember extends Model
{
    public const PUBLIC_CACHE_KEY = 'public.team-members.v2';

    protected $fillable = ['name', 'role', 'biography', 'photo_path', 'linkedin_url', 'github_url', 'facebook_url', 'email', 'display_order', 'is_visible'];

    protected function casts(): array
    {
        return ['display_order' => 'integer', 'is_visible' => 'boolean'];
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('is_visible', true)->orderBy('display_order')->orderBy('id');
    }
}
