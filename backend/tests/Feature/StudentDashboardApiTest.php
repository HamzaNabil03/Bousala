<?php

namespace Tests\Feature;

use App\Enums\CvOrderStatus;
use App\Enums\DegreeLevel;
use App\Enums\DocumentKind;
use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Models\AiTool;
use App\Models\Document;
use App\Models\Scholarship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    private function student(): User
    {
        return User::factory()->withProfile()->create();
    }

    /** ملف أكاديمي مكتمل بما يكفي لإرسال طلب صياغة */
    private function completeProfile(User $user): void
    {
        $profile = $user->profile;

        $profile->update([
            'full_name_ar' => 'أحمد محمد عبدالله سالم',
            'country' => 'فلسطين',
            'bio' => 'طالب هندسة برمجيات شغوف بالذكاء الاصطناعي وعلوم البيانات ويطمح لإكمال دراساته العليا.',
        ]);

        $profile->educations()->create([
            'degree' => DegreeLevel::Bachelor,
            'major' => 'هندسة البرمجيات',
            'institution' => 'الجامعة الإسلامية بغزة',
            'graduation_year' => 2027,
            'gpa_value' => 3.88,
            'gpa_scale' => 4,
        ]);
    }

    public function test_a_user_can_read_and_update_their_personal_info(): void
    {
        $user = $this->student();

        $this->actingAs($user)->getJson('/api/v1/profile')->assertOk();

        $this->actingAs($user)->putJson('/api/v1/profile', [
            'full_name_ar' => 'أحمد محمد عبدالله سالم',
            'country' => 'فلسطين',
            'city' => 'غزة',
            'bio' => 'نبذة تعريفية كافية لاختبار الحفظ والاسترجاع.',
        ])->assertOk()->assertJsonPath('data.city', 'غزة');
    }

    public function test_profile_items_can_be_added_and_removed(): void
    {
        $user = $this->student();

        $response = $this->actingAs($user)->postJson('/api/v1/profile/educations', [
            'degree' => DegreeLevel::Bachelor->value,
            'major' => 'هندسة البرمجيات',
            'institution' => 'الجامعة الإسلامية بغزة',
            'graduation_year' => 2027,
            'gpa_value' => 3.88,
            'gpa_scale' => 4,
        ])->assertOk();

        $educationId = $response->json('data.educations.0.id');
        $this->assertNotNull($educationId);

        $this->actingAs($user)->postJson('/api/v1/profile/skills', ['name' => 'تحليل البيانات'])
            ->assertOk()
            ->assertJsonCount(1, 'data.skills');

        $this->actingAs($user)
            ->deleteJson("/api/v1/profile/educations/{$educationId}")
            ->assertOk()
            ->assertJsonCount(0, 'data.educations');
    }

    public function test_a_duplicate_skill_is_rejected(): void
    {
        $user = $this->student();

        $this->actingAs($user)->postJson('/api/v1/profile/skills', ['name' => 'Python'])->assertOk();
        $this->actingAs($user)->postJson('/api/v1/profile/skills', ['name' => 'Python'])->assertStatus(422);
    }

    public function test_profile_completion_grows_as_the_profile_is_filled(): void
    {
        $user = $this->student();

        $before = $this->actingAs($user)->getJson('/api/v1/profile/completion')->json('data.percent');

        $this->completeProfile($user);

        $after = $this->actingAs($user)->getJson('/api/v1/profile/completion')->json('data.percent');

        $this->assertGreaterThan($before, $after);
    }

    public function test_a_user_can_upload_and_delete_a_document(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $user = $this->student();

        $response = $this->actingAs($user)->postJson('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('cv.pdf', 200, 'application/pdf'),
            'kind' => DocumentKind::Cv->value,
        ])->assertCreated();

        $documentId = $response->json('data.id');
        $document = Document::findOrFail($documentId);

        Storage::disk('local')->assertExists($document->path);
        Storage::disk('public')->assertMissing($document->path);
        $this->assertSame(route('documents.file', $document, false), $response->json('data.url'));

        $this->actingAs($user)->getJson('/api/v1/documents')->assertOk()->assertJsonCount(1, 'data');
        $this->actingAs($user)->get("/api/v1/documents/{$documentId}/file")
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $this->actingAs($user)->deleteJson("/api/v1/documents/{$documentId}")->assertOk();
        Storage::disk('local')->assertMissing($document->path);
        Storage::disk('public')->assertMissing($document->path);
        $this->actingAs($user)->getJson('/api/v1/documents')->assertJsonCount(0, 'data');
    }

    public function test_legacy_public_documents_are_downloaded_only_through_the_owner_route(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $owner = $this->student();
        $path = 'documents/legacy.pdf';
        Storage::disk('public')->put($path, 'legacy private document');

        $document = $owner->documents()->create([
            'kind' => DocumentKind::Cv,
            'original_name' => 'legacy.pdf',
            'stored_name' => 'legacy.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 23,
            'path' => $path,
        ]);

        $this->actingAs($owner)->get("/api/v1/documents/{$document->id}/file")->assertOk();
        $this->actingAs($this->student())->get("/api/v1/documents/{$document->id}/file")->assertNotFound();
    }

    public function test_an_oversized_or_unsupported_file_is_rejected(): void
    {
        Storage::fake('local');
        $user = $this->student();

        $this->actingAs($user)->postJson('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('script.exe', 100),
            'kind' => DocumentKind::Cv->value,
        ])->assertUnprocessable()->assertJsonValidationErrors('file');
    }

    public function test_a_user_cannot_delete_another_users_document(): void
    {
        Storage::fake('local');
        $owner = $this->student();
        $intruder = $this->student();

        $documentId = $this->actingAs($owner)->postJson('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('cv.pdf', 120, 'application/pdf'),
            'kind' => DocumentKind::Cv->value,
        ])->json('data.id');

        $this->actingAs($intruder)->get("/api/v1/documents/{$documentId}/file")->assertNotFound();
        $this->actingAs($intruder)->deleteJson("/api/v1/documents/{$documentId}")->assertForbidden();
    }

    public function test_a_guest_cannot_download_a_private_document(): void
    {
        Storage::fake('local');
        $user = $this->student();
        $path = 'documents/private.pdf';
        Storage::disk('local')->put($path, 'private document');

        $document = $user->documents()->create([
            'kind' => DocumentKind::Cv,
            'original_name' => 'cv.pdf',
            'stored_name' => 'private.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 16,
            'path' => $path,
        ]);

        $this->getJson("/api/v1/documents/{$document->id}/file")->assertUnauthorized();
    }

    public function test_notifications_are_listed_with_tab_counts_and_can_be_marked_read(): void
    {
        $user = $this->student();

        $user->notifications()->createMany([
            ['type' => NotificationType::NewMatch, 'title' => 'منحة جديدة تناسبك'],
            ['type' => NotificationType::DeadlineReminder, 'title' => 'تذكير بموعد التقديم'],
        ]);

        $this->actingAs($user)->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.tabs.all', 2)
            ->assertJsonPath('meta.tabs.matches', 1)
            ->assertJsonPath('meta.unread', 2);

        $this->actingAs($user)->postJson('/api/v1/notifications/read-all')->assertOk();

        $this->actingAs($user)->getJson('/api/v1/notifications')->assertJsonPath('meta.unread', 0);
    }

    public function test_the_dashboard_overview_returns_completion_and_matches(): void
    {
        $user = $this->student();
        $this->completeProfile($user);

        Scholarship::factory()
            ->configured([DegreeLevel::Master], ['هندسة البرمجيات'])
            ->create();

        $this->actingAs($user)->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['completion' => ['percent', 'sections'], 'matches', 'upcoming_deadlines', 'stats'],
            ])
            ->assertJsonCount(1, 'data.matches');
    }

    public function test_an_ai_tool_runs_in_mock_mode_without_an_api_key(): void
    {
        config(['menhity.ai.gemini.api_key' => null, 'menhity.ai.anthropic.api_key' => null]);

        AiTool::create(['key' => 'profile-review', 'name_ar' => 'تقييم الملف الشخصي', 'sort_order' => 0]);

        $user = $this->student();
        $this->completeProfile($user);

        $this->actingAs($user)->postJson('/api/v1/ai-tools/profile-review/run')
            ->assertOk()
            ->assertJsonPath('data.mocked', true)
            ->assertJsonStructure(['data' => ['output', 'run_id']]);
    }

    public function test_an_enhancer_tool_requires_input_text(): void
    {
        AiTool::firstOrCreate(['key' => 'cv-enhancer'], ['name_ar' => 'تحسين السيرة الذاتية', 'sort_order' => 1]);

        $user = $this->student();

        $this->actingAs($user)->postJson('/api/v1/ai-tools/cv-enhancer/run', ['input' => 'قصير'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('input');
    }

    public function test_a_cv_order_cannot_be_submitted_with_an_incomplete_profile(): void
    {
        $user = $this->student();

        $this->actingAs($user)->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'أكمل «المعلومات الشخصية والنبذة» قبل إرسال الطلب.');
    }

    public function test_a_complete_profile_can_submit_a_cv_order_and_is_assigned_an_expert(): void
    {
        $expert = User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);

        $response = $this->actingAs($user)->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->assertCreated();

        $this->assertNotNull($response->json('data.order_number'));
        $this->assertSame(CvOrderStatus::InExpertReview->value, $response->json('data.status'));
        // خمس مراحل: تأكيد التحويل ثم الأربع التي يعمل الفريق خلالها
        $this->assertCount(5, $response->json('data.timeline'));
        // بلا سعر مضبوط تبقى الخدمة مجانية فتتجاوز انتظار التحويل
        $this->assertFalse($response->json('data.is_paid'));
        $this->assertSame('not_required', $response->json('data.payment_status'));
        $this->assertCount(4, $response->json('data.ats_checks'));

        $order = $user->cvOrders()->first();
        $this->assertSame($expert->id, $order->expert_id);

        // إشعار للطالب بالاستلام
        $this->assertTrue(
            $user->notifications()->where('type', NotificationType::OrderUpdate)->exists(),
        );
    }

    public function test_a_second_order_of_the_same_kind_is_blocked_while_one_is_active(): void
    {
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);

        $this->actingAs($user)->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->assertCreated();
        $this->actingAs($user)->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->assertStatus(409);
    }

    public function test_a_different_service_is_allowed_alongside_an_active_order(): void
    {
        Storage::fake('local');
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);

        $this->actingAs($user)->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->assertCreated();

        // مساران مستقلان — الأول لا يحجب الثاني
        $this->actingAs($user)->postJson('/api/v1/cv-orders', [
            'kind' => 'letter_build',
            'file' => UploadedFile::fake()->create('letter.pdf', 40, 'application/pdf'),
        ])->assertCreated();

        $this->assertSame(2, $user->cvOrders()->count());
    }

    public function test_a_user_can_send_a_note_to_their_expert(): void
    {
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);

        $orderId = $this->actingAs($user)->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->json('data.id');

        $this->actingAs($user)->postJson("/api/v1/cv-orders/{$orderId}/notes", [
            'body' => 'أرجو التركيز على خبرتي البحثية ومشروع التخرّج.',
        ])->assertOk()->assertJsonCount(1, 'data.notes');
    }

    public function test_a_user_cannot_read_another_users_cv_order(): void
    {
        User::factory()->expert()->create();
        $owner = $this->student();
        $this->completeProfile($owner);
        $orderId = $this->actingAs($owner)->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->json('data.id');

        $intruder = $this->student();
        $this->actingAs($intruder)->getJson("/api/v1/cv-orders/{$orderId}")->assertForbidden();
    }

    public function test_an_improvement_request_requires_the_student_to_attach_a_file(): void
    {
        $user = $this->student();

        $this->actingAs($user)->postJson('/api/v1/document-improvements', ['kind' => 'cv_improve', 'consent' => true])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    /**
     * كتابة خطاب من الصفر كالسيرة تماماً: لا ملف سابق يُرفق، بل بيانات
     * الملف الأكاديمي وملاحظة الطالب عمّا يريد أن يتحدّث عنه الخطاب.
     */
    public function test_a_letter_build_request_does_not_require_a_source_file(): void
    {
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);

        $response = $this->actingAs($user)->postJson('/api/v1/cv-orders', [
            'kind' => 'letter_build',
            'note' => 'أتقدّم لمنحة ماجستير في هولندا وأريد إبراز شغفي بالبحث العلمي.',
        ])->assertCreated();

        $this->assertSame('letter_build', $response->json('data.kind'));
        $this->assertNull($response->json('data.source_file_name'));
    }

    public function test_a_letter_build_request_cannot_be_submitted_with_an_incomplete_profile(): void
    {
        $user = $this->student();

        $this->actingAs($user)->postJson('/api/v1/cv-orders', ['kind' => 'letter_build'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'أكمل «المعلومات الشخصية والنبذة» قبل إرسال الطلب.');
    }

    /**
     * نقطة «الطلب النشط» يستخدمها ويزرد كتابة السيرة تحديداً، فلا يجوز أن
     * يحجبه طلبٌ من نوع آخر (تحسين سيرة، أو خطاب) قائمٌ بالتوازي.
     */
    public function test_the_active_endpoint_ignores_orders_of_other_kinds(): void
    {
        Storage::fake('local');
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);

        $this->actingAs($user)->postJson('/api/v1/cv-orders', [
            'kind' => 'letter_build',
            'file' => UploadedFile::fake()->create('سيرتي.pdf', 80, 'application/pdf'),
        ])->assertCreated();

        $this->actingAs($user)->getJson('/api/v1/cv-orders/active')
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    /**
     * طلبٌ سُلِّم انتهى أمره. بلا هذا الاستثناء يظل ويزرد كتابة السيرة
     * يصف طلباً مُسلَّماً بأنه «قيد المعالجة» إلى الأبد، ويمنع طلباً جديداً.
     */
    public function test_the_active_endpoint_ignores_a_delivered_order(): void
    {
        Storage::fake('local');
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);

        $orderId = $this->actingAs($user)
            ->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->json('data.id');

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->post("/api/v1/admin/orders/{$orderId}/deliver", [
            'file' => UploadedFile::fake()->create('النهائية.pdf', 90, 'application/pdf'),
        ])->assertOk();

        $this->actingAs($user)->getJson('/api/v1/cv-orders/active')
            ->assertOk()
            ->assertJsonPath('data', null);

        // ولا يمنع طلب «كتابة سيرة» جديداً
        $this->actingAs($user)->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])
            ->assertCreated();
    }

    public function test_the_active_endpoint_reports_an_in_progress_cv_build_order(): void
    {
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);

        $orderId = $this->actingAs($user)
            ->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->json('data.id');

        $this->actingAs($user)->getJson('/api/v1/cv-orders/active')
            ->assertOk()
            ->assertJsonPath('data.id', $orderId);
    }

    public function test_an_improvement_request_stores_the_file_privately(): void
    {
        Storage::fake('local');
        User::factory()->expert()->create();
        $user = $this->student();

        // Legacy manual improvement orders remain readable and private.
        $order = app(\App\Services\CvOrderService::class)->submit(
            $user, $user->profile, \App\Enums\CvOrderKind::CvImprove,
            UploadedFile::fake()->create('سيرتي.pdf', 120, 'application/pdf'),
        );
        $response = $this->actingAs($user)->getJson('/api/v1/cv-orders/'.$order->id)->assertOk();

        $this->assertSame('cv_improve', $response->json('data.kind'));
        $this->assertSame('سيرتي.pdf', $response->json('data.source_file_name'));

        $order = $user->cvOrders()->first();
        Storage::disk('local')->assertExists($order->source_file_path);
        $this->assertStringStartsWith('cv-orders/source/', $order->source_file_path);
    }

    public function test_the_student_downloads_the_delivered_file_and_outsiders_cannot(): void
    {
        Storage::fake('local');
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);
        $orderId = $this->actingAs($user)
            ->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->json('data.id');

        // قبل التسليم لا يوجد ما يُحمَّل
        $this->actingAs($user)->get("/api/v1/cv-orders/{$orderId}/file")->assertNotFound();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->post("/api/v1/admin/orders/{$orderId}/deliver", [
            'file' => UploadedFile::fake()->create('النهائية.pdf', 90, 'application/pdf'),
        ])->assertOk();

        $download = $this->actingAs($user)->get("/api/v1/cv-orders/{$orderId}/file")
            ->assertOk()
            ->assertDownload();

        /*
         * يكتب Laravel اسماً لاتينياً في filename للتوافق القديم، والاسم العربي
         * في filename* وفق RFC 5987 — وهو ما تقرأه المتصفحات فعلياً.
         */
        $this->assertStringContainsString(
            "filename*=utf-8''".rawurlencode('النهائية.pdf'),
            $download->headers->get('content-disposition'),
        );

        $intruder = $this->student();
        $this->actingAs($intruder)->get("/api/v1/cv-orders/{$orderId}/file")->assertForbidden();
    }

    /**
     * رابط إشعار «سيرتك جاهزة» كان يحمل قطعة «orders/» زائدة لا تطابق أي
     * مسار في الواجهة، فيصل الطالب 404 بدل صفحة متابعة طلبه. كل إشعار
     * يخصّ طلب سيرة يجب أن يشير إلى المسار الحقيقي: /tools/cv-builder/{id}.
     */
    public function test_order_notifications_link_to_the_real_tracking_route(): void
    {
        User::factory()->expert()->create();
        $user = $this->student();
        $this->completeProfile($user);
        $orderId = $this->actingAs($user)
            ->postJson('/api/v1/cv-orders', ['kind' => 'cv_build'])->json('data.id');

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->patchJson("/api/v1/admin/orders/{$orderId}/advance", [
            'status' => 'ats_check',
        ])->assertOk();
        $this->actingAs($admin)->patchJson("/api/v1/admin/orders/{$orderId}/advance", [
            'status' => 'delivered',
        ])->assertOk();

        $urls = $user->notifications()->pluck('action_url');

        $this->assertNotEmpty($urls);
        foreach ($urls as $url) {
            if (str_starts_with($url, '/tools/cv-builder')) {
                $this->assertSame("/tools/cv-builder/{$orderId}", $url);
            }
        }
    }

    public function test_settings_password_change_revokes_other_devices(): void
    {
        $user = User::factory()->create(['password' => 'Menhity@2026']);

        $tokenA = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'Menhity@2026',
        ])->json('token');

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'Menhity@2026',
        ]);

        $this->assertSame(2, $user->tokens()->count());

        $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->putJson('/api/v1/settings/password', [
                'current_password' => 'Menhity@2026',
                'new_password' => 'NewMenhity@2027',
                'new_password_confirmation' => 'NewMenhity@2027',
            ])->assertOk();

        $this->assertSame(1, $user->fresh()->tokens()->count());
    }

    public function test_a_student_cannot_reach_the_admin_api(): void
    {
        $this->actingAs($this->student())->getJson('/api/v1/admin/dashboard')->assertForbidden();
    }

    public function test_an_admin_can_read_the_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure(['data' => ['stats', 'attention']]);
    }
}
