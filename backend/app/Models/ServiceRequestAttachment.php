<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestAttachment extends Model
{
    protected $fillable = ['service_request_id', 'uploaded_by', 'kind', 'field_key', 'original_name', 'path', 'mime_type', 'size'];
    public function request(): BelongsTo { return $this->belongsTo(ServiceRequest::class, 'service_request_id'); }
    public function uploader(): BelongsTo { return $this->belongsTo(User::class, 'uploaded_by'); }
}
