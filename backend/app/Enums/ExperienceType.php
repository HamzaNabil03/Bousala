<?php

namespace App\Enums;

enum ExperienceType: string
{
    case Internship = 'internship';
    case Job = 'job';
    case Research = 'research';
    case Volunteer = 'volunteer';

    public function label(): string
    {
        return match ($this) {
            self::Internship => 'تدريب',
            self::Job => 'عمل',
            self::Research => 'بحثي',
            self::Volunteer => 'تطوعي',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
