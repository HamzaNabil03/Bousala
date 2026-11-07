<?php

namespace App\Http\Resources;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Notification */
class NotificationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'title' => $this->title,
            'body' => $this->body,
            'badge_label' => $this->badge_label,
            'action_label' => $this->action_label,
            'action_url' => $this->action_url,
            'is_read' => $this->read_at !== null,
            'created_at' => $this->created_at,
        ];
    }
}
