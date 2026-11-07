<?php

namespace App\Enums;

enum ScholarshipStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Published = 'published';
    case Expired = 'expired';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::PendingReview => 'بانتظار المراجعة',
            self::Published => 'مفعّلة',
            self::Expired => 'منتهية',
            self::Archived => 'مؤرشفة',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
