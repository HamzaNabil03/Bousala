<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case Planned = 'planned';
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case Accepted = 'accepted';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Planned => 'ينوي التقديم',
            self::InProgress => 'قيد التجهيز',
            self::Submitted => 'تم التقديم',
            self::Accepted => 'مقبول',
            self::Rejected => 'مرفوض',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
