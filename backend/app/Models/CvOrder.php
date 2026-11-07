<?php

namespace App\Models;

use App\Enums\CvOrderKind;
use App\Enums\CvOrderStatus;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CvOrder extends Model
{
    /** الحذف ناعم: الطلب المدفوع سجلٌّ ماليّ لا يُمحى بمحوه من اللوحة */
    use SoftDeletes;

    protected $fillable = [
        'order_number',
        'user_id',
        'kind',
        'source_file_path',
        'source_file_name',
        'final_file_name',
        'request_note',
        'price_amount',
        'price_currency',
        'payment_status',
        'receipt_file_path',
        'receipt_file_name',
        'payment_note',
        'payment_rejection_reason',
        'payment_reviewed_at',
        'payment_reviewed_by',
        'expert_id',
        'status',
        'current_step',
        'data_snapshot',
        'ats_score',
        'expected_delivery_at',
        'submitted_at',
        'delivered_at',
        'final_file_path',
        'deletion_reason',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => CvOrderStatus::class,
            'kind' => CvOrderKind::class,
            'payment_status' => PaymentStatus::class,
            'price_amount' => 'decimal:2',
            'payment_reviewed_at' => 'datetime',
            'data_snapshot' => 'array',
            'current_step' => 'integer',
            'ats_score' => 'integer',
            'expected_delivery_at' => 'datetime',
            'submitted_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expert(): BelongsTo
    {
        return $this->belongsTo(User::class, 'expert_id');
    }

    public function paymentReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payment_reviewed_by');
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /** الطلب مدفوع إن جُمّد له سعر لحظة الإرسال */
    public function isPaid(): bool
    {
        return (float) $this->price_amount > 0;
    }

    public function timeline(): HasMany
    {
        return $this->hasMany(CvOrderEvent::class)->orderBy('sort_order');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(CvOrderNote::class)->latest();
    }

    public function atsChecks(): HasMany
    {
        return $this->hasMany(CvAtsCheck::class)->orderBy('sort_order');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', CvOrderStatus::active());
    }

    /** MNH-CV-8921 */
    public static function generateOrderNumber(): string
    {
        do {
            $number = 'MNH-CV-'.random_int(1000, 9999);
        } while (static::where('order_number', $number)->exists());

        return $number;
    }
}
