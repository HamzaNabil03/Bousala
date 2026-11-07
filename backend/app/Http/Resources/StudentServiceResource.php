<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'name' => $this->name, 'slug' => $this->slug,
            'system_key' => $this->system_key, 'description' => $this->description,
            'price' => (float) $this->price, 'currency' => $this->currency,
            'icon' => $this->icon, 'has_image' => filled($this->image_path),
            'delivery_days' => $this->delivery_days, 'instructions' => $this->instructions,
            'updated_at' => $this->updated_at?->toISOString(),
            'is_active' => $this->is_active, 'sort_order' => $this->sort_order,
            'category' => $this->whenLoaded('category', fn () => $this->category ? ['id' => $this->category->id, 'name' => $this->category->name, 'slug' => $this->category->slug] : null),
            'fields' => $this->whenLoaded('fields', fn () => $this->fields->map(fn ($field) => [
                'id' => $field->id, 'key' => $field->key, 'label' => $field->label,
                'type' => $field->type, 'placeholder' => $field->placeholder,
                'options' => $field->options ?? [], 'is_required' => $field->is_required,
                'sort_order' => $field->sort_order,
            ])->values()),
            'requests_count' => $this->whenCounted('requests'),
        ];
    }
}
