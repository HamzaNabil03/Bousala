<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SiteSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_meta_exposes_database_driven_site_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->postJson('/api/v1/admin/site-settings', $this->payload([
            'name' => 'منصة الاختبار',
            'contact_email' => 'hello@example.com',
            'whatsapp' => '+970599000000',
        ]))->assertOk();

        $this->getJson('/api/v1/meta')
            ->assertOk()
            ->assertJsonPath('data.site.name', 'منصة الاختبار')
            ->assertJsonPath('data.site.email', 'hello@example.com')
            ->assertJsonPath('data.site.whatsapp', '+970599000000');
    }

    public function test_only_admins_can_modify_site_settings(): void
    {
        $this->postJson('/api/v1/admin/site-settings', $this->payload())
            ->assertUnauthorized();

        $student = User::factory()->create();
        $this->actingAs($student)->postJson('/api/v1/admin/site-settings', $this->payload())
            ->assertForbidden();
    }

    public function test_empty_social_links_are_not_exposed_publicly(): void
    {
        $admin = User::factory()->admin()->create();
        $payload = $this->payload();
        $payload['social']['facebook'] = null;
        $payload['social']['instagram'] = 'https://instagram.com/bousla';

        $this->actingAs($admin)->postJson('/api/v1/admin/site-settings', $payload)->assertOk();

        $this->getJson('/api/v1/meta')
            ->assertJsonMissingPath('data.site.social.facebook')
            ->assertJsonPath('data.site.social.instagram', 'https://instagram.com/bousla');
    }

    public function test_executable_uploads_are_rejected(): void
    {
        Storage::fake('site_media');
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->withHeader('Accept', 'application/json')->post('/api/v1/admin/site-settings', [
            ...$this->payload(),
            'hero' => UploadedFile::fake()->create('payload.php', 10, 'application/x-php'),
        ])->assertUnprocessable()->assertJsonValidationErrors('hero');
    }

    /** @param array<string, mixed> $siteOverrides */
    private function payload(array $siteOverrides = []): array
    {
        return [
            'site' => array_merge([
                'name' => 'بَوْصلة',
                'name_en' => 'Bousla',
                'tagline' => 'منصة منح',
                'description' => 'وصف المنصة',
                'contact_email' => 'contact@example.com',
                'secondary_email' => null,
                'phone' => '+970592000000',
                'whatsapp' => null,
                'address' => 'فلسطين',
                'working_hours' => null,
                'footer_description' => 'وصف الفوتر',
                'copyright_text' => null,
            ], $siteOverrides),
            'social' => [
                'facebook' => null,
                'instagram' => null,
                'linkedin' => null,
                'youtube' => null,
                'tiktok' => null,
                'telegram' => null,
                'x' => null,
            ],
        ];
    }
}
