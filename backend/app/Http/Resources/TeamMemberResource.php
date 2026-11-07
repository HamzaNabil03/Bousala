<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class TeamMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $photoUrl = null;
        if ($this->photo_path) {
            $photoUrl = $request->routeIs('admin.*')
                ? URL::temporarySignedRoute('admin-preview.team-members.photo', now()->addMinutes(10), ['teamMember' => $this->id, 'v' => $this->updated_at?->timestamp], absolute: false)
                : "/api/v1/team-members/{$this->id}/photo?v=".$this->updated_at?->timestamp;
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'role' => $this->role,
            'biography' => $this->biography,
            'linkedin_url' => $this->linkedin_url,
            'github_url' => $this->github_url,
            'facebook_url' => $this->facebook_url,
            'email' => $this->email,
            'display_order' => $this->display_order,
            'is_visible' => $this->is_visible,
            'has_photo' => filled($this->photo_path),
            'photo_url' => $photoUrl,
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
