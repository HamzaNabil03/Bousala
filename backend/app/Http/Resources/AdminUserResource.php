<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class AdminUserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'suspension_reason' => $this->suspension_reason,
            'headline' => $this->whenLoaded('profile', fn () => $this->profile?->headline),
            'country' => $this->whenLoaded('profile', fn () => $this->profile?->country),
            'completion_percent' => $this->whenLoaded(
                'profile',
                fn () => $this->profile?->completion_percent ?? 0,
            ),
            'created_at' => $this->created_at,
            'last_login_at' => $this->last_login_at,
        ];
    }
}
