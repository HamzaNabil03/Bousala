<?php

namespace App\Mail;

use App\Models\User;
use App\Services\VerificationCodeService;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** رسالة رمز استعادة كلمة المرور. */
class PasswordResetCodeMail extends Mailable
{
    public function __construct(
        public readonly User $user,
        public readonly string $code,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "رمز استعادة كلمة المرور في بَوْصلة: {$this->code}",
            replyTo: array_filter([$this->replyToAddress()]),
        );
    }

    /** عنوان الردّ إن ضُبط — يسمح بالردّ على بريد حقيقي رغم قيود المُرسِل */
    private function replyToAddress(): ?Address
    {
        $address = config('mail.reply_to.address');

        return filled($address) ? new Address($address, config('mail.reply_to.name')) : null;
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verification-code',
            text: 'emails.verification-code-text',
            with: [
                'name' => $this->user->firstName(),
                'code' => $this->code,
                'heading' => 'استعادة كلمة المرور',
                'intro' => 'وصلنا طلب لتغيير كلمة مرور حسابك. استخدم الرمز التالي لمتابعة العملية.',
                'minutes' => VerificationCodeService::TTL_MINUTES,
                'disclaimer' => 'إن لم تطلب أنت تغيير كلمة المرور، تجاهل هذه الرسالة — حسابك آمن ولن يتغيّر شيء.',
            ],
        );
    }
}
