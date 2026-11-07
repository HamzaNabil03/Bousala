<?php

namespace Tests\Feature;

use App\Models\AiToolRun;
use App\Models\User;
use App\Services\DocumentImprovementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use ZipArchive;

class DocumentImprovementTest extends TestCase
{
    use RefreshDatabase;

    private const TEXT = 'Sara Ahmad completed her engineering degree in 2024 and worked on a university research project.';

    private function file(): UploadedFile
    {
        $path = app(DocumentImprovementService::class)->docx(self::TEXT);
        $file = UploadedFile::fake()->createWithContent('cv.docx', file_get_contents($path));
        unlink($path);
        return $file;
    }

    private function provider(): void
    {
        config(['menhity.ai.provider' => 'gemini', 'menhity.ai.gemini.api_key' => 'fake-key']);
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['candidates' => [[
            'finishReason' => 'STOP', 'content' => ['parts' => [['text' => json_encode([
                'summary' => 'تمت مراجعة السيرة.', 'issues' => ['تحسين الوضوح.'], 'revised_text' => self::TEXT,
            ])]]],
        ]]])]);
    }

    public function test_student_receives_feedback_and_private_download(): void
    {
        $this->provider();
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $response = $this->postJson('/api/v1/document-improvements', ['kind' => 'cv_improve', 'file' => $this->file(), 'consent' => true]);
        $response->assertCreated()->assertJsonPath('data.result.revised_text', self::TEXT);
        $id = $response->json('data.id');
        $this->getJson('/api/v1/document-improvements')->assertJsonCount(1, 'data');
        $this->get('/api/v1/document-improvements/'.$id.'/file')->assertOk()->assertDownload('bousla-improved-'.$id.'.docx');
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/v1/document-improvements')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/document-improvements/'.$id.'/file')->assertNotFound();
    }

    public function test_no_demo_result_when_provider_is_missing(): void
    {
        config(['menhity.ai.provider' => 'gemini', 'menhity.ai.gemini.api_key' => null]);
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/v1/document-improvements', ['kind' => 'cv_improve', 'file' => $this->file(), 'consent' => true])->assertStatus(503);
        $this->assertDatabaseCount('ai_tool_runs', 0);
    }

    public function test_consent_and_authentication_are_required(): void
    {
        $this->postJson('/api/v1/document-improvements')->assertUnauthorized();
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/v1/document-improvements', ['kind' => 'cv_improve', 'file' => $this->file()])->assertUnprocessable()->assertJsonValidationErrors('consent');
    }

    public function test_invalid_provider_output_cannot_be_downloaded(): void
    {
        config(['menhity.ai.provider' => 'gemini', 'menhity.ai.gemini.api_key' => 'fake-key']);
        Http::fake(['*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => 'incomplete']]]]]])]);
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/v1/document-improvements', ['kind' => 'letter_improve', 'file' => $this->file(), 'consent' => true])->assertStatus(502);
        $run = AiToolRun::firstOrFail();
        $this->getJson('/api/v1/document-improvements/'.$run->id.'/file')->assertStatus(409);
    }

    public function test_a_letter_uploaded_to_the_cv_tool_returns_a_redirect_notice(): void
    {
        config(['menhity.ai.provider' => 'gemini', 'menhity.ai.gemini.api_key' => 'fake-key']);
        Http::fake(['*' => Http::response(['candidates' => [[
            'finishReason' => 'STOP', 'content' => ['parts' => [['text' => json_encode([
                'valid' => false,
                'document_class' => 'letter',
                'suggested_kind' => 'letter_improve',
                'notice' => 'هذا خطاب دافع. انتقل إلى تحسين خطاب الدافع.',
                'summary' => null,
                'issues' => [],
                'revised_text' => null,
            ], JSON_UNESCAPED_UNICODE)]]],
        ]]])]);
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/v1/document-improvements', [
            'kind' => 'cv_improve', 'file' => $this->file(), 'consent' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.result.valid', false)
            ->assertJsonPath('data.result.suggested_kind', 'letter_improve');
        $this->getJson('/api/v1/document-improvements/'.$response->json('data.id').'/file')->assertStatus(409);
    }

    public function test_new_manual_improvement_orders_are_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());
        foreach (['cv_improve', 'letter_improve'] as $kind) {
            $this->postJson('/api/v1/cv-orders', ['kind' => $kind])->assertUnprocessable()->assertJsonValidationErrors('kind');
        }
        $this->getJson('/api/v1/cv-orders/payment-info')->assertJsonCount(2, 'data.services');
    }

    public function test_pdf_text_is_extracted_and_image_only_pdf_is_rejected(): void
    {
        $service = app(DocumentImprovementService::class);
        $file = UploadedFile::fake()->createWithContent('cv.pdf', $this->pdf(self::TEXT));
        $this->assertStringContainsString(self::TEXT, $service->extract($file));
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $service->extract(UploadedFile::fake()->createWithContent('scan.pdf', $this->pdf('')));
    }

    private function pdf(string $text): string
    {
        $stream = "BT /F1 10 Tf 40 700 Td ($text) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 900 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length '.strlen($stream).">>\nstream\n".$stream."\nendstream",
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1)." 0 obj\n".$object."\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 6\n0000000000 65535 f \n";
        foreach (array_slice($offsets, 1) as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        return $pdf."trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n$xref\n%%EOF";
    }

    public function test_export_escapes_xml_and_round_trips_arabic(): void
    {
        $text = 'سارة أحمد — مهندسة باحثة لديها خبرة في التعليم والعمل المجتمعي. <test> & data';
        $service = app(DocumentImprovementService::class);
        $path = $service->docx($text);
        try {
            $file = new UploadedFile($path, 'result.docx', null, null, true);
            $this->assertSame($text, $service->extract($file));
            $zip = new ZipArchive; $zip->open($path);
            $this->assertStringContainsString('<w:bidi/>', $zip->getFromName('word/document.xml'));
            $zip->close();
        } finally { unlink($path); }
    }
}
