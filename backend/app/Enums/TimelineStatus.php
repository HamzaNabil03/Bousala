<?php

namespace App\Enums;

enum TimelineStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Done = 'done';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'بانتظار',
            self::InProgress => 'قيد التنفيذ',
            self::Done => 'مكتمل',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
