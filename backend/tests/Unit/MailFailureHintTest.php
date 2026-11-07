<?php

namespace Tests\Unit;

use App\Mail\MailFailureHint;
use PHPUnit\Framework\TestCase;

/** يغطّي ترجمة أخطاء الإرسال إلى خطوات عملية — الحالات التي ظهرت فعلاً في سجلات النشر. */
class MailFailureHintTest extends TestCase
{
    public function test_a_port_the_provider_does_not_serve_is_named_before_anything_else(): void
    {
        $hint = MailFailureHint::for(
            'Connection could not be established with host "smtp.gmail.com:2587": '
            .'stream_socket_client(): Unable to connect to smtp.gmail.com:2587 (Connection timed out)',
        );

        $this->assertStringContainsString('2587', $hint);
        $this->assertStringContainsString('Resend', $hint);
        $this->assertStringContainsString('587 أو 465', $hint);
    }

    public function test_a_valid_port_that_times_out_points_at_the_host_blocking_smtp(): void
    {
        $hint = MailFailureHint::for('Connection could not be established with host "smtp.gmail.com:587": (Connection timed out)');

        $this->assertStringContainsString('تحجب', $hint);
        $this->assertStringContainsString('MAIL_MAILER=gmail', $hint);
        $this->assertStringNotContainsString('لا يقدّمه', $hint);
    }

    public function test_an_unknown_host_is_not_accused_of_a_wrong_port(): void
    {
        $hint = MailFailureHint::for('Connection could not be established with host "mail.example.org:2525": (Connection timed out)');

        $this->assertStringContainsString('mail.example.org', $hint);
        $this->assertStringContainsString('MAIL_HOST', $hint);
        $this->assertStringNotContainsString('لا يقدّمه', $hint);
    }

    public function test_an_expired_refresh_token_sends_the_admin_back_to_gmail_auth(): void
    {
        $hint = MailFailureHint::for('رفضت Google طلب الرمز (invalid_grant): Token has been expired or revoked.');

        $this->assertStringContainsString('menhity:gmail-auth', $hint);
        $this->assertStringContainsString('Testing', $hint);
    }

    public function test_a_disabled_gmail_api_is_explained(): void
    {
        $hint = MailFailureHint::for('خطأ من Gmail (403): Gmail API has not been used in project 1 before or it is disabled.');

        $this->assertStringContainsString('Gmail API', $hint);
    }

    public function test_the_existing_smtp_hints_are_kept(): void
    {
        $this->assertStringContainsString('MAIL_SCHEME', MailFailureHint::for('The "tls" scheme is not supported'));
        $this->assertStringContainsString('App Password', MailFailureHint::for('535-5.7.8 Username and Password not accepted'));
        $this->assertStringContainsString('MAIL_HOST', MailFailureHint::for('php_network_getaddresses: getaddrinfo for smtp.gmial.com failed'));
    }
}
