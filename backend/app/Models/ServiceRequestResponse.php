<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestResponse extends Model
{
    protected $fillable = ['service_request_id', 'service_field_id', 'field_key', 'field_label', 'field_type', 'value'];
    public function request(): BelongsTo { return $this->belongsTo(ServiceRequest::class, 'service_request_id'); }
}
