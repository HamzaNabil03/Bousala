<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * رسائل "تواصل معنا": أي زائر يرسلها بلا حساب، فلا وسيلة لتصل صاحبها
 * إلا من لوحة الإدارة — كانت تُحفظ بلا أي واجهة تعرضها.
 */
class ContactMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_submits_a_contact_message(): void
    {
        $this->postJson('/api/v1/contact', [
            'name' => 'سارة أحمد',
            'email' => 'sara@example.com',
            'subject' => 'استفسار عن التسجيل',
            'body' => 'أرغب بمعرفة المزيد عن آلية التقديم على المنح عبر المنصة.',
        ])->assertCreated();

        $this->assertDatabaseHas('contact_messages', [
            'name' => 'سارة أحمد',
            'email' => 'sara@example.com',
            'is_read' => false,
        ]);
    }

    public function test_a_contact_message_requires_a_valid_email_and_a_real_body(): void
    {
        $this->postJson('/api/v1/contact', [
            'name' => 'سارة',
            'email' => 'not-an-email',
            'body' => 'قصير',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'body']);
    }

    public function test_an_admin_lists_contact_messages_newest_first(): void
    {
        ContactMessage::factory()->count(2)->create(['is_read' => true]);
        $latest = ContactMessage::factory()->create(['is_read' => false, 'name' => 'أحدث رسالة']);

        $response = $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/v1/admin/contact-messages')
            ->assertOk();

        $this->assertSame($latest->id, $response->json('data.0.id'));
        $this->assertSame(3, $response->json('meta.total'));
        $this->assertSame(1, $response->json('meta.unread'));
    }

    public function test_opening_a_message_marks_it_read(): void
    {
        $message = ContactMessage::factory()->create(['is_read' => false]);
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->getJson("/api/v1/admin/contact-messages/{$message->id}")
            ->assertOk()
            ->assertJsonPath('data.is_read', true)
            ->assertJsonPath('data.body', $message->body);

        $this->assertDatabaseHas('contact_messages', ['id' => $message->id, 'is_read' => true]);
    }

    public function test_a_student_cannot_reach_contact_messages(): void
    {
        ContactMessage::factory()->create();
        $student = User::factory()->withProfile()->create();

        $this->actingAs($student)->getJson('/api/v1/admin/contact-messages')->assertForbidden();
    }
}
