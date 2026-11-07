<?php

namespace Tests\Feature;

use App\Enums\CvOrderKind;
use App\Enums\CvOrderStatus;
use App\Enums\DegreeLevel;
use App\Models\User;
use App\Services\CvOrderService;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * مساحة عمل الخبير: طلباته المسنَدة له وحدها، وما يلزمه لإنجازها —
 * لا شيء من صلاحيات الإدارة (الدفع، الحذف، التسعير، المستخدمون).
 */
class ExpertOrdersTest extends TestCase
{
    use RefreshDatabase;

    private function studentWithOrder(User $expert): array
    {
        $student = User::factory()->withProfile()->create();
        $profile = $student->profile;

        $profile->update([
            'full_name_ar' => 'سارة أحمد خليل',
            'bio' => 'طالبة علوم حاسوب تتقدّم لمنحة ماجستير في الذكاء الاصطناعي.',
        ]);
        $profile->educations()->create([
            'degree' => DegreeLevel::Bachelor,
            'major' => 'علوم حاسوب',
            'institution' => 'الجامعة الإسلامية',
            'graduation_year' => 2024,
        ]);

        $order = app(CvOrderService::class)->submit($student, $profile);
        $order->update(['expert_id' => $expert->id]);

        return [$student, $order->fresh()];
    }

    public function test_an_expert_only_sees_orders_assigned_to_them(): void
    {
        $expert = User::factory()->expert()->create();
        $otherExpert = User::factory()->expert()->create();
        [, $order] = $this->studentWithOrder($expert);
        $this->studentWithOrder($otherExpert);

        $response = $this->actingAs($expert)->getJson('/api/v1/expert/orders')->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($order->id, $response->json('data.0.id'));
    }

    public function test_a_student_cannot_reach_the_expert_workspace(): void
    {
        $student = User::factory()->withProfile()->create();

        $this->actingAs($student)->getJson('/api/v1/expert/orders')->assertForbidden();
    }

    public function test_an_expert_cannot_act_on_an_order_assigned_to_someone_else(): void
    {
        $expert = User::factory()->expert()->create();
        $intruder = User::factory()->expert()->create();
        [, $order] = $this->studentWithOrder($expert);

        $this->actingAs($intruder)->getJson("/api/v1/expert/orders/{$order->id}")->assertForbidden();
        $this->actingAs($intruder)->get("/api/v1/expert/orders/{$order->id}/source")->assertForbidden();
        $this->actingAs($intruder)->patchJson("/api/v1/expert/orders/{$order->id}/advance", [
            'status' => 'ats_check',
        ])->assertForbidden();
    }

    public function test_an_expert_downloads_the_students_source_file(): void
    {
        Storage::fake('local');
        $expert = User::factory()->expert()->create();
        $student = User::factory()->withProfile()->create();

        $order = app(CvOrderService::class)->submit(
            $student,
            $student->profile,
            CvOrderKind::CvImprove,
            UploadedFile::fake()->create('سيرتي.pdf', 100, 'application/pdf'),
        );
        $order->update(['expert_id' => $expert->id]);

        $this->actingAs($expert)->get("/api/v1/expert/orders/{$order->id}/source")
            ->assertOk()
            ->assertDownload();
    }

    public function test_an_expert_advances_a_free_order_step_by_step_but_not_out_of_order(): void
    {
        $expert = User::factory()->expert()->create();
        [, $order] = $this->studentWithOrder($expert);

        // مجانية، فتبدأ من «قيد المراجعة اليدوية» مباشرة
        $this->assertSame(CvOrderStatus::InExpertReview, $order->status);

        // لا يجوز القفز إلى «تم التسليم» مباشرة
        $this->actingAs($expert)->patchJson("/api/v1/expert/orders/{$order->id}/advance", [
            'status' => 'delivered',
        ])->assertStatus(422);

        $this->actingAs($expert)->patchJson("/api/v1/expert/orders/{$order->id}/advance", [
            'status' => 'ats_check',
        ])->assertOk()->assertJsonPath('data.status', 'ats_check');
    }

    public function test_an_expert_cannot_advance_a_paid_order_before_payment_is_confirmed(): void
    {
        Storage::fake('local');
        $expert = User::factory()->expert()->create();
        $student = User::factory()->withProfile()->create();

        app(SettingsService::class)->put(
            SettingsService::PRICING,
            ['currency' => 'ILS', 'cv_build' => 50, 'cv_improve' => 0, 'letter_improve' => 0, 'letter_build' => 0],
        );
        app(SettingsService::class)->put(
            SettingsService::PAYMENT,
            ['account_holder' => 'بَوْصلة', 'bank_name' => 'بنك', 'account_number' => '123', 'iban' => null, 'instructions' => null],
        );

        $student->profile->update([
            'full_name_ar' => 'خالد سليم',
            'bio' => 'طالب هندسة يتقدّم لمنحة دكتوراه.',
        ]);
        $student->profile->educations()->create([
            'degree' => DegreeLevel::Bachelor,
            'major' => 'هندسة',
            'institution' => 'جامعة بيرزيت',
            'graduation_year' => 2023,
        ]);

        $order = app(CvOrderService::class)->submit(
            $student,
            $student->profile,
            CvOrderKind::CvBuild,
            null,
            null,
            UploadedFile::fake()->image('receipt.jpg'),
        );
        $order->update(['expert_id' => $expert->id]);

        $this->actingAs($expert)->patchJson("/api/v1/expert/orders/{$order->id}/advance", [
            'status' => 'in_expert_review',
        ])->assertStatus(422);
    }

    public function test_the_student_and_the_assigned_expert_can_exchange_notes(): void
    {
        $expert = User::factory()->expert()->create();
        [$student, $order] = $this->studentWithOrder($expert);

        $this->actingAs($student)->postJson("/api/v1/cv-orders/{$order->id}/notes", [
            'body' => 'أرجو التركيز على مشروع التخرّج والمنحة البحثية.',
        ])->assertOk();

        $this->actingAs($expert)->postJson("/api/v1/cv-orders/{$order->id}/notes", [
            'body' => 'تم، سأبرزه في الفقرة الأولى.',
        ])->assertOk()->assertJsonCount(2, 'data.notes');
    }

    public function test_an_unrelated_expert_cannot_note_a_students_order(): void
    {
        $expert = User::factory()->expert()->create();
        $intruder = User::factory()->expert()->create();
        [, $order] = $this->studentWithOrder($expert);

        $this->actingAs($intruder)->postJson("/api/v1/cv-orders/{$order->id}/notes", [
            'body' => 'محاولة تدخّل في طلب لا يخصّني.',
        ])->assertForbidden();
    }
}
