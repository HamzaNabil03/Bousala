<?php

namespace App\Enums;

enum AiRunStatus: string
{
    case Running = 'running';
    case Success = 'success';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Running => 'قيد التنفيذ',
            self::Success => 'مكتمل',
            self::Failed => 'فشل',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
