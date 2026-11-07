<?php

namespace App\Enums;

enum CvOrderStatus: string
{
    case Draft = 'draft';
    case PendingApproval = 'pending_approval';
    case Submitted = 'submitted';
    case InExpertReview = 'in_expert_review';
    case AtsCheck = 'ats_check';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::PendingApproval => 'بانتظار تأكيد التحويل',
            self::Submitted => 'تم الاستلام',
            self::InExpertReview => 'قيد المراجعة اليدوية بواسطة الخبير',
            self::AtsCheck => 'الفحص الدقيق لمعايير ATS',
            self::Delivered => 'تم التسليم',
            self::Cancelled => 'ملغي',
        };
    }

    /** تسمية قصيرة تصلح لزرّ أو شارة ضيّقة */
    public function shortLabel(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::PendingApproval => 'تأكيد التحويل',
            self::Submitted => 'مستلم',
            self::InExpertReview => 'مراجعة الخبير',
            self::AtsCheck => 'فحص ATS',
            self::Delivered => 'تسليم',
            self::Cancelled => 'ملغي',
        };
    }

    /**
     * الحالات التي تُعدّ الطلب فيها قيد المعالجة.
     * الانتظار عند تأكيد التحويل منها: الطلب قائم ويمنع طلباً آخر لنفس الخدمة.
     */
    public static function active(): array
    {
        return [
            self::PendingApproval->value,
            self::Submitted->value,
            self::InExpertReview->value,
            self::AtsCheck->value,
        ];
    }

    /** موضع الحالة في التايملاين (null = خارج المسار) */
    public function timelineIndex(): ?int
    {
        return match ($this) {
            self::PendingApproval => 0,
            self::Submitted => 1,
            self::InExpertReview => 2,
            self::AtsCheck => 3,
            self::Delivered => 4,
            default => null,
        };
    }

    /**
     * المرحلة التالية في زرّ «تقديم الطلب» لدى الإدارة.
     * الانتظار عند التحويل ليس منها: يتجاوزه قبولُ الإشعار لا زرّ المراحل.
     */
    public function next(): ?self
    {
        return match ($this) {
            self::Submitted => self::InExpertReview,
            self::InExpertReview => self::AtsCheck,
            self::AtsCheck => self::Delivered,
            default => null,
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
