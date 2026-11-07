<?php

namespace App\Enums;

enum LanguageRequirement: string
{
    case Required = 'required';
    case NotRequired = 'not_required';

    public function label(): string
    {
        return match ($this) {
            self::Required => 'يتطلب أيلتس / توفل',
            self::NotRequired => 'لا يشترط شهادة لغة',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
