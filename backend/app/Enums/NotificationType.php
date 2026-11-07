<?php

namespace App\Enums;

enum NotificationType: string
{
    case NewMatch = 'new_match';
    case DeadlineReminder = 'deadline_reminder';
    case DocumentReviewed = 'document_reviewed';
    case SavedUpdated = 'saved_updated';
    case DeadlinePassed = 'deadline_passed';
    case OrderUpdate = 'order_update';
    case System = 'system';

    public function label(): string
    {
        return match ($this) {
            self::NewMatch => 'منحة جديدة تناسبك',
            self::DeadlineReminder => 'تذكير بموعد التقديم',
            self::DocumentReviewed => 'اكتمال مراجعة المستندات',
            self::SavedUpdated => 'تحديث المحفوظات',
            self::DeadlinePassed => 'انتهاء موعد التقديم',
            self::OrderUpdate => 'تحديث على طلبك',
            self::System => 'إشعار من المنصة',
        };
    }

    /** تصنيف الإشعار ضمن تابات صفحة الإشعارات */
    public static function forTab(string $tab): ?array
    {
        return match ($tab) {
            'matches' => [self::NewMatch->value],
            'deadlines' => [self::DeadlineReminder->value, self::DeadlinePassed->value],
            default => null,
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
