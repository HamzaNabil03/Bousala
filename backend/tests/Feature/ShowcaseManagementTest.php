<?php

namespace Tests\Feature;

use App\Models\TeamMember;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ShowcaseManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_team_endpoint_only_returns_visible_members_in_order(): void
    {
        TeamMember::create(['name' => 'Hidden', 'role' => 'Designer', 'display_order' => 0, 'is_visible' => false]);
        TeamMember::create(['name' => 'Second', 'role' => 'Developer', 'display_order' => 20, 'is_visible' => true]);
        TeamMember::create(['name' => 'First', 'role' => 'Founder', 'display_order' => 10, 'is_visible' => true]);

        $this->getJson('/api/v1/team-members')->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'First')
            ->assertJsonPath('data.1.name', 'Second')
            ->assertJsonMissing(['name' => 'Hidden']);

        $this->assertIsArray(Cache::get(TeamMember::PUBLIC_CACHE_KEY));
    }

    public function test_public_testimonials_only_return_published_and_due_items(): void
    {
        Testimonial::create(['student_name' => 'Draft', 'feedback_text' => 'This is a genuine draft testimonial.', 'display_order' => 0, 'is_published' => false]);
        Testimonial::create(['student_name' => 'Future', 'feedback_text' => 'This testimonial is scheduled for later.', 'display_order' => 1, 'is_published' => true, 'published_at' => now()->addDay()]);
        Testimonial::create(['student_name' => 'Published', 'feedback_text' => 'This is a genuine published testimonial.', 'rating' => 5, 'display_order' => 2, 'is_published' => true]);

        $this->getJson('/api/v1/testimonials')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.student_name', 'Published')
            ->assertJsonPath('data.0.rating', 5);

        $this->assertIsArray(Cache::get(Testimonial::PUBLIC_CACHE_KEY));
    }

    public function test_only_staff_can_manage_team_and_testimonials(): void
    {
        $student = User::factory()->create();
        $payload = ['name' => 'Member', 'role' => 'Founder', 'display_order' => 0, 'is_visible' => true];

        $this->postJson('/api/v1/admin/team-members', $payload)->assertUnauthorized();
        $this->actingAs($student)->postJson('/api/v1/admin/team-members', $payload)->assertForbidden();
    }

    public function test_admin_can_create_member_with_photo_and_hide_it(): void
    {
        Storage::fake('site_media');
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/api/v1/admin/team-members', [
            'name' => 'Real Member', 'role' => 'Developer', 'display_order' => 3, 'is_visible' => 1,
            'photo' => UploadedFile::fake()->image('member.jpg', 600, 600),
        ])->assertCreated()->assertJsonPath('data.has_photo', true);

        $id = $response->json('data.id');
        $this->getJson('/api/v1/team-members')->assertJsonPath('data.0.name', 'Real Member');

        $this->actingAs($admin)->putJson("/api/v1/admin/team-members/{$id}", [
            'name' => 'Real Member', 'role' => 'Developer', 'display_order' => 3, 'is_visible' => false,
        ])->assertOk();

        $this->getJson('/api/v1/team-members')->assertJsonCount(0, 'data');
    }

    public function test_invalid_photo_and_rating_are_rejected(): void
    {
        Storage::fake('site_media');
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/api/v1/admin/testimonials', [
            'student_name' => 'Student', 'feedback_text' => 'A genuine feedback message from the student.',
            'rating' => 6, 'display_order' => 0, 'is_published' => 1,
            'photo' => UploadedFile::fake()->create('payload.php', 10, 'application/x-php'),
        ])->assertUnprocessable()->assertJsonValidationErrors(['rating', 'photo']);
    }

    public function test_draft_does_not_require_consent_but_publishing_does_and_is_audited(): void
    {
        $admin = User::factory()->admin()->create();
        $payload = [
            'student_name' => 'Student',
            'feedback_text' => 'A genuine feedback message from the student.',
            'display_order' => 0,
            'is_published' => false,
        ];

        $draft = $this->actingAs($admin)->postJson('/api/v1/admin/testimonials', $payload)
            ->assertCreated()
            ->assertJsonPath('data.is_published', false)
            ->assertJsonPath('data.consent_confirmed', false);

        $id = $draft->json('data.id');
        $this->actingAs($admin)->putJson("/api/v1/admin/testimonials/{$id}", [
            ...$payload,
            'is_published' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('consent_confirmed');

        $this->actingAs($admin)->putJson("/api/v1/admin/testimonials/{$id}", [
            ...$payload,
            'is_published' => true,
            'consent_confirmed' => true,
        ])->assertOk()->assertJsonPath('data.consent_confirmed', true);

        $testimonial = Testimonial::findOrFail($id);
        $this->assertSame($admin->id, $testimonial->consent_confirmed_by);
        $this->assertNotNull($testimonial->consent_confirmed_at);
        $this->getJson('/api/v1/testimonials')->assertJsonPath('data.0.id', $id);

        $this->actingAs($admin)->putJson("/api/v1/admin/testimonials/{$id}", [
            ...$payload,
            'is_published' => false,
        ])->assertOk();
        $this->getJson('/api/v1/testimonials')->assertJsonCount(0, 'data');
    }
}
