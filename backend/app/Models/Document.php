<?php

namespace App\Models;

use App\Enums\DocumentKind;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $fillable = [
        'user_id', 'kind', 'original_name', 'stored_name', 'mime_type', 'size_bytes', 'path',
    ];

    protected function casts(): array
    {
        return [
            'kind' => DocumentKind::class,
            'size_bytes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function url(): string
    {
        return route('documents.file', $this, false);
    }

    /** 2.4 MB */
    public function formattedSize(): string
    {
        $bytes = $this->size_bytes;

        return match (true) {
            $bytes < 1024 => $bytes.' B',
            $bytes < 1048576 => round($bytes / 1024, 1).' KB',
            default => round($bytes / 1048576, 1).' MB',
        };
    }
}
