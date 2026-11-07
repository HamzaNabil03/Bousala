<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestHistory extends Model
{
    protected $fillable = ['service_request_id', 'actor_id', 'event', 'from_value', 'to_value', 'note'];
    public function request(): BelongsTo { return $this->belongsTo(ServiceRequest::class, 'service_request_id'); }
    public function actor(): BelongsTo { return $this->belongsTo(User::class, 'actor_id'); }
}
