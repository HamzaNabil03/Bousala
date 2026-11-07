<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_user_stats_count_recently_seen_accounts(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $recentUser = User::factory()->create();
        $staleUser = User::factory()->create();
        $recentUser->forceFill(['last_seen_at' => now()->subSeconds(30)])->save();
        $staleUser->forceFill(['last_seen_at' => now()->subMinutes(10)])->save();

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonPath('meta.stats.online', 2);
    }

    public function test_admin_user_stats_never_report_zero_online_users(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $staleUser = User::factory()->create();
        $staleUser->forceFill(['last_seen_at' => now()->subMinutes(10)])->save();

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonPath('meta.stats.online', 1);

        $this->assertNotNull($admin->fresh()->last_seen_at);
    }

    public function test_presence_heartbeat_and_offline_requests_update_last_seen(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['last_seen_at' => now()->subMinutes(2)])->save();

        $this->actingAs($user)
            ->postJson('/api/v1/presence/heartbeat')
            ->assertOk();

        $this->assertNotNull($user->fresh()->last_seen_at);

        $this->postJson('/api/v1/presence/offline')->assertOk();

        $this->assertNull($user->fresh()->last_seen_at);
    }

    public function test_user_export_neutralizes_spreadsheet_formulas(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        User::factory()->create([
            'name' => '=HYPERLINK("https://example.com","click")',
            'email' => '@SUM(1,1)',
        ]);

        $csv = $this->actingAs($admin)
            ->get('/api/v1/admin/users/export')
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringContainsString("'@SUM", $csv);
    }
}