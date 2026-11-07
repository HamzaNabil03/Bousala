<?php

namespace App\Enums;

enum UserRole: string
{
    case Student = 'student';
    case Expert = 'expert';
    case Moderator = 'moderator';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Student => 'طالب',
            self::Expert => 'خبير أكاديمي',
            self::Moderator => 'مشرف',
            self::Admin => 'مدير النظام',
        };
    }

    /** هل يملك هذا الدور صلاحية دخول لوحة الإدارة؟ */
    public function isAdminLevel(): bool
    {
        return in_array($this, [self::Admin, self::Moderator], true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
