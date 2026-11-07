<?php

namespace App\Http\Resources;

use App\Models\CvOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CvOrder */
class CvOrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'kind' => $this->kind->value,
            'kind_label' => $this->kind->label(),
            'request_note' => $this->request_note,
            'source_file_name' => $this->source_file_name,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),

            'price_amount' => (float) $this->price_amount,
            'price_currency' => $this->price_currency,
            'is_paid' => $this->isPaid(),
            'payment_status' => $this->payment_status->value,
            'payment_status_label' => $this->payment_status->label(),
            'payment_blocks_work' => $this->payment_status->blocksWork(),
            'receipt_file_name' => $this->receipt_file_name,
            'payment_note' => $this->payment_note,
            'payment_rejection_reason' => $this->payment_rejection_reason,
            'payment_reviewed_at' => $this->payment_reviewed_at,
            'current_step' => $this->current_step,
            'ats_score' => $this->ats_score,
            'submitted_at' => $this->submitted_at,
            'expected_delivery_at' => $this->expected_delivery_at,
            'delivered_at' => $this->delivered_at,
            'has_final_file' => filled($this->final_file_path),
            'final_file_name' => $this->final_file_name,
            'data_snapshot' => $this->data_snapshot,

            'expert' => $this->whenLoaded('expert', fn () => $this->expert ? [
                'name' => $this->expert->name,
                'title_prefix' => $this->expert->expertProfile?->title_prefix ?? 'د.',
                'specialization' => $this->expert->expertProfile?->specialization,
                'bio' => $this->expert->expertProfile?->bio,
            ] : null),

            'timeline' => $this->whenLoaded('timeline', fn () => $this->timeline->map(fn ($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'description' => $e->description,
                'status' => $e->status->value,
                'status_label' => $e->status->label(),
                'occurred_at' => $e->occurred_at,
            ])->all()),

            'ats_checks' => $this->whenLoaded('atsChecks', fn () => $this->atsChecks->map(fn ($c) => [
                'id' => $c->id,
                'label' => $c->label,
                'passed' => $c->passed,
            ])->all()),

            'notes' => $this->whenLoaded('notes', fn () => $this->notes->map(fn ($n) => [
                'id' => $n->id,
                'body' => $n->body,
                'author_name' => $n->author->name,
                'author_role' => $n->author->role->value,
                'created_at' => $n->created_at,
            ])->all()),

            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
        ];
    }
}
