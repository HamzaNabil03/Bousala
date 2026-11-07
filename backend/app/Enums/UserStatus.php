<?php

namespace App\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'نشط',
            self::Inactive => 'غير نشط',
            self::Suspended => 'موقوف',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
