<?php

namespace App\Http\Resources;

use App\Models\PersonalAccessToken;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PersonalAccessToken */
class SessionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'browser' => $this->browser ?? 'متصفح غير معروف',
            'os' => $this->os ?? 'نظام غير معروف',
            'device_type' => $this->device_type ?? 'desktop',
            'ip_address' => $this->ip_address,
            'last_used_at' => $this->last_used_at ?? $this->created_at,
            'created_at' => $this->created_at,
            'is_current' => $this->id === $request->user()?->currentAccessToken()?->id,
        ];
    }
}
