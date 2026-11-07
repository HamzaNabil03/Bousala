<?php

namespace Tests\Feature;

use App\Enums\DegreeLevel;
use App\Enums\FundingType;
use App\Models\Scholarship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScholarshipApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitors_can_browse_published_scholarships(): void
    {
        Scholarship::factory()->count(3)->configured()->create();
        Scholarship::factory()->draft()->create();

        $this->getJson('/api/v1/scholarships')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_scholarships_can_be_filtered_by_level_and_funding(): void
    {
        Scholarship::factory()->configured([DegreeLevel::Master])->create();
        Scholarship::factory()
            ->configured([DegreeLevel::Bachelor])
            ->create(['funding_type' => FundingType::Partial]);

        $this->getJson('/api/v1/scholarships?level=master')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/scholarships?funding=partial')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_scholarships_can_be_searched_by_title(): void
    {
        Scholarship::factory()->configured()->create(['title_ar' => 'المنحة الحكومية التركية']);
        Scholarship::factory()->configured()->create(['title_ar' => 'منحة تشيفينينغ']);

        $this->getJson('/api/v1/scholarships?q=التركية')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title_ar', 'المنحة الحكومية التركية');
    }

    public function test_a_draft_scholarship_is_hidden_from_visitors(): void
    {
        $scholarship = Scholarship::factory()->draft()->create();

        $this->getJson("/api/v1/scholarships/{$scholarship->slug}")->assertNotFound();
    }

    public function test_scholarship_details_include_the_full_sections(): void
    {
        $scholarship = Scholarship::factory()->configured()->create();
        $scholarship->eligibility()->create(['text' => 'درجة بكالوريوس معترف بها.', 'sort_order' => 0]);
        $scholarship->documents()->create(['name' => 'السيرة الذاتية (CV)', 'note' => 'PDF', 'sort_order' => 0]);
        $scholarship->benefits()->create(['title' => 'تغطية كاملة', 'sort_order' => 0]);

        $this->getJson("/api/v1/scholarships/{$scholarship->slug}")
            ->assertOk()
            ->assertJsonCount(1, 'data.eligibility')
            ->assertJsonCount(1, 'data.documents')
            ->assertJsonCount(1, 'data.benefits')
            ->assertJsonCount(1, 'data.majors');
    }

    public function test_an_authenticated_user_sees_a_match_score(): void
    {
        $user = User::factory()->withProfile()->create();
        $profile = $user->profile;

        $profile->educations()->create([
            'degree' => DegreeLevel::Bachelor,
            'major' => 'هندسة البرمجيات',
            'institution' => 'الجامعة الإسلامية بغزة',
            'graduation_year' => 2027,
            'gpa_value' => 3.8,
            'gpa_scale' => 4,
        ]);

        Scholarship::factory()->configured([DegreeLevel::Master], ['هندسة البرمجيات'])->create();

        $response = $this->actingAs($user)->getJson('/api/v1/scholarships')->assertOk();

        $this->assertGreaterThan(0, $response->json('data.0.match_score'));
        $this->assertNotEmpty($response->json('data.0.match_reasons'));
    }

    public function test_a_user_can_save_and_unsave_a_scholarship(): void
    {
        $user = User::factory()->create();
        $scholarship = Scholarship::factory()->configured()->create();

        $this->actingAs($user)
            ->postJson("/api/v1/saved/{$scholarship->slug}")
            ->assertOk()
            ->assertJsonPath('saved', true);

        $this->actingAs($user)->getJson('/api/v1/saved')->assertOk()->assertJsonCount(1, 'data');

        $this->actingAs($user)
            ->postJson("/api/v1/saved/{$scholarship->slug}")
            ->assertOk()
            ->assertJsonPath('saved', false);
    }

    public function test_saving_requires_authentication(): void
    {
        $scholarship = Scholarship::factory()->create();

        $this->postJson("/api/v1/saved/{$scholarship->slug}")->assertUnauthorized();
    }

    public function test_the_facets_endpoint_returns_country_and_major_counts(): void
    {
        Scholarship::factory()->configured()->create(['country_code' => 'TR', 'country_name_ar' => 'تركيا']);

        $this->getJson('/api/v1/scholarships/facets')
            ->assertOk()
            ->assertJsonPath('data.countries.0.code', 'TR')
            ->assertJsonPath('data.countries.0.count', 1);
    }
}
