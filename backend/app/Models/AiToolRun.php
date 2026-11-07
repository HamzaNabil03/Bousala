<?php

namespace App\Models;

use App\Enums\AiRunStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiToolRun extends Model
{
    protected $fillable = [
        'ai_tool_id', 'user_id', 'status', 'input', 'output', 'error_message', 'duration_ms',
    ];

    protected function casts(): array
    {
        return [
            'status' => AiRunStatus::class,
            'input' => 'array',
            'duration_ms' => 'integer',
        ];
    }

    public function tool(): BelongsTo
    {
        return $this->belongsTo(AiTool::class, 'ai_tool_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
