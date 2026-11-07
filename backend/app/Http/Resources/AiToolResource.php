<?php

namespace App\Http\Resources;

use App\Models\AiTool;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AiTool */
class AiToolResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'name_ar' => $this->name_ar,
            'description' => $this->description,
            'icon' => $this->icon,
            'is_active' => $this->is_active,
            'runs_count' => $this->whenCounted('runs'),
        ];
    }
}
