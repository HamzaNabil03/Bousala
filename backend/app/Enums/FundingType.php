<?php

namespace App\Enums;

enum FundingType: string
{
    case Full = 'full';
    case Partial = 'partial';
    case TuitionOnly = 'tuition_only';

    public function label(): string
    {
        return match ($this) {
            self::Full => 'ممولة بالكامل',
            self::Partial => 'تمويل جزئي',
            self::TuitionOnly => 'رسوم دراسية فقط',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
