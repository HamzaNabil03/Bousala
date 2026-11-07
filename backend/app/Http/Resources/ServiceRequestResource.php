<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'reference_number' => $this->reference_number,
            'student_name' => $this->student_name, 'student_email' => $this->student_email,
            'student_phone' => $this->student_phone, 'notes' => $this->notes,
            'service_name' => $this->service_name_snapshot,
            'service' => $this->whenLoaded('service', fn () => $this->service ? ['id' => $this->service->id, 'slug' => $this->service->slug, 'name' => $this->service->name] : null),
            'scholarship' => $this->whenLoaded('scholarship', fn () => $this->scholarship ? ['id' => $this->scholarship->id, 'slug' => $this->scholarship->slug, 'title' => $this->scholarship->title_ar] : null),
            'price' => (float) $this->price_snapshot, 'currency' => $this->currency_snapshot,
            'status' => $this->status, 'status_label' => self::statusLabel($this->status),
            'payment_status' => $this->payment_status, 'payment_status_label' => self::paymentLabel($this->payment_status),
            'internal_notes' => $this->when($request->user()?->isAdminLevel(), $this->internal_notes),
            'submitted_at' => $this->submitted_at?->toISOString(), 'completed_at' => $this->completed_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'responses' => $this->whenLoaded('responses', fn () => $this->responses->map(fn ($item) => ['key' => $item->field_key, 'label' => $item->field_label, 'type' => $item->field_type, 'value' => $item->value])),
            'attachments' => $this->whenLoaded('attachments', fn () => $this->attachments->map(fn ($item) => ['id' => $item->id, 'kind' => $item->kind, 'field_key' => $item->field_key, 'name' => $item->original_name, 'size' => $item->size])),
            'history' => $this->whenLoaded('history', fn () => $this->history->map(fn ($item) => ['event' => $item->event, 'from' => $item->from_value, 'to' => $item->to_value, 'note' => $item->note, 'created_at' => $item->created_at?->toISOString()])),
        ];
    }

    private static function statusLabel(string $status): string
    {
        return ['pending_review' => 'بانتظار المراجعة', 'awaiting_payment_verification' => 'بانتظار التحقق من الدفع', 'payment_verified' => 'تم التحقق من الدفع', 'in_progress' => 'قيد التنفيذ', 'completed' => 'مكتمل', 'rejected' => 'مرفوض', 'cancelled' => 'ملغي'][$status] ?? $status;
    }

    private static function paymentLabel(string $status): string
    {
        return ['not_required' => 'غير مطلوب', 'pending_verification' => 'بانتظار التحقق', 'verified' => 'تم التحقق', 'rejected' => 'مرفوض'][$status] ?? $status;
    }
}
