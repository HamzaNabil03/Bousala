<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceRequest extends Model
{
    protected $fillable = ['submission_token', 'reference_number', 'user_id', 'service_id', 'scholarship_id', 'student_name', 'student_email', 'student_phone', 'notes', 'service_name_snapshot', 'price_snapshot', 'currency_snapshot', 'status', 'payment_status', 'internal_notes', 'submitted_at', 'completed_at'];
    protected function casts(): array { return ['price_snapshot' => 'decimal:2', 'submitted_at' => 'datetime', 'completed_at' => 'datetime']; }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function service(): BelongsTo { return $this->belongsTo(StudentService::class, 'service_id'); }
    public function scholarship(): BelongsTo { return $this->belongsTo(Scholarship::class); }
    public function responses(): HasMany { return $this->hasMany(ServiceRequestResponse::class); }
    public function attachments(): HasMany { return $this->hasMany(ServiceRequestAttachment::class); }
    public function history(): HasMany { return $this->hasMany(ServiceRequestHistory::class)->latest(); }
    public static function generateReference(): string
    {
        do { $reference = 'BSA-'.now()->format('ymd').'-'.random_int(1000, 9999); }
        while (static::where('reference_number', $reference)->exists());
        return $reference;
    }
}
