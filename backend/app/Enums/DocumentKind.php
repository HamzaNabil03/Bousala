<?php

namespace App\Enums;

enum DocumentKind: string
{
    case Cv = 'cv';
    case MotivationLetter = 'motivation_letter';
    case Transcript = 'transcript';
    case Recommendation = 'recommendation';
    case Passport = 'passport';
    case Certificate = 'certificate';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Cv => 'سيرة ذاتية',
            self::MotivationLetter => 'خطاب دافع',
            self::Transcript => 'سجل أكاديمي',
            self::Recommendation => 'خطاب توصية',
            self::Passport => 'جواز سفر',
            self::Certificate => 'شهادة',
            self::Other => 'أخرى',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
