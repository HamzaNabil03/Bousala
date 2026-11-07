<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'first_name' => $this->firstName(),
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_admin_level' => $this->role->isAdminLevel(),
            'suspension_reason' => $this->suspension_reason,
            'email_verified' => $this->hasVerifiedEmail(),
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'settings' => [
                'profile_visible' => $this->profile_visible,
                'share_data_with_universities' => $this->share_data_with_universities,
                'notify_new_matches' => $this->notify_new_matches,
                'notify_application_status' => $this->notify_application_status,
                'notify_news' => $this->notify_news,
            ],
            'completion_percent' => $this->whenLoaded(
                'profile',
                fn () => $this->profile?->completion_percent ?? 0,
            ),
            'headline' => $this->whenLoaded('profile', fn () => $this->profile?->headline),
            'created_at' => $this->created_at,
            'last_login_at' => $this->last_login_at,
        ];
    }
}
