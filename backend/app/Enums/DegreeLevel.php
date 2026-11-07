<?php

namespace App\Enums;

enum DegreeLevel: string
{
    case HighSchool = 'high_school';
    case Diploma = 'diploma';
    case Bachelor = 'bachelor';
    case Master = 'master';
    case Phd = 'phd';

    public function label(): string
    {
        return match ($this) {
            self::HighSchool => 'الثانوية العامة',
            self::Diploma => 'دبلوم',
            self::Bachelor => 'بكالوريوس',
            self::Master => 'ماجستير',
            self::Phd => 'دكتوراه',
        };
    }

    /** ترتيب الدرجات لتحديد الدرجة التالية في المسار الأكاديمي */
    public function rank(): int
    {
        return match ($this) {
            self::HighSchool => 0,
            self::Diploma => 1,
            self::Bachelor => 2,
            self::Master => 3,
            self::Phd => 4,
        };
    }

    public function next(): self
    {
        return match ($this) {
            self::HighSchool => self::Bachelor,
            self::Diploma => self::Bachelor,
            self::Bachelor => self::Master,
            self::Master => self::Phd,
            self::Phd => self::Phd,
        };
    }

    /** المستويات المعروضة في فلاتر البحث */
    public static function filterable(): array
    {
        return [self::Bachelor, self::Master, self::Phd];
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
