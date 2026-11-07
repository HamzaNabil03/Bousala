<?php

namespace App\Enums;

/** حالة التحقّق من إشعار التحويل الذي أرفقه الطالب */
enum PaymentStatus: string
{
    case NotRequired = 'not_required';
    case AwaitingReview = 'awaiting_review';
    case Accepted = 'accepted';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::NotRequired => 'خدمة مجانية',
            self::AwaitingReview => 'بانتظار تأكيد التحويل',
            self::Accepted => 'تم تأكيد التحويل',
            self::Rejected => 'إشعار التحويل مرفوض',
        };
    }

    /** الطلب متوقّف عند الدفع ولا يبدأ العمل عليه */
    public function blocksWork(): bool
    {
        return $this === self::AwaitingReview || $this === self::Rejected;
    }
}
