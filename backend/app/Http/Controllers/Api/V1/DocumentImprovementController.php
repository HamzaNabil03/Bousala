<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AiRunStatus;
use App\Http\Controllers\Controller;
use App\Models\AiTool;
use App\Models\AiToolRun;
use App\Services\AiService;
use App\Services\DocumentImprovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DocumentImprovementController extends Controller
{
    public function index(Request $request)
    {
        $runs = AiToolRun::where('user_id', $request->user()->id)
            ->where('input->document_improvement', true)->latest()->limit(20)->get();
        return response()->json(['data' => $runs->map(fn ($run) => $this->result($run))]);
    }

    public function store(Request $request, AiService $ai, DocumentImprovementService $documents)
    {
        $data = $request->validate([
            'kind' => ['required', 'in:cv_improve,letter_improve'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'extensions:pdf,doc,docx', 'max:5120'],
            'target' => ['nullable', 'string', 'max:500'],
            'consent' => ['required', 'accepted'],
        ]);
        $key = $data['kind'] === 'cv_improve' ? 'cv-enhancer' : 'letter-enhancer';
        $tool = AiTool::firstOrCreate(['key' => $key], ['name_ar' => $key, 'is_active' => true, 'sort_order' => 0]);
        abort_unless($tool->is_active, 422, 'هذه الأداة معطّلة حالياً.');
        abort_unless($ai->isConfigured(), 503, 'خدمة الذكاء الاصطناعي غير متاحة حالياً. حاول لاحقاً.');
        $lock = Cache::lock('document-improvement:'.$request->user()->id, 180);
        abort_unless($lock->get(), 409, 'لديك ملف قيد المعالجة. انتظر ظهور النتيجة في سجل ملفاتك.');
        $run = null;
        $started = microtime(true);
        try {
            $text = $documents->extract($request->file('file'));
            $run = AiToolRun::create([
                'ai_tool_id' => $tool->id, 'user_id' => $request->user()->id,
                'status' => AiRunStatus::Running,
                'input' => ['document_improvement' => true, 'kind' => $data['kind']],
            ]);
            $result = $ai->improveDocument($data['kind'], $text, $data['target'] ?? null);
            $run->update(['status' => AiRunStatus::Success, 'output' => json_encode($result, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), 'duration_ms' => (int) ((microtime(true) - $started) * 1000)]);
            return response()->json(['data' => $this->result($run)], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $run?->update(['status' => AiRunStatus::Failed, 'error_message' => 'Document improvement failed']);
            Log::warning('Document improvement failed', [
                'run_id' => $run?->id,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'تعذّر إكمال التحسين. لم يتم إنشاء ملف نهائي؛ حاول مجدداً لاحقاً.'], 502);
        } finally {
            $lock->release();
        }
    }

    public function download(Request $request, AiToolRun $run, DocumentImprovementService $documents)
    {
        abort_unless($run->user_id === $request->user()->id && ($run->input['document_improvement'] ?? false), 404);
        abort_unless($run->status === AiRunStatus::Success, 409, 'الملف غير جاهز للتنزيل.');
        $result = json_decode($run->output, true, flags: JSON_THROW_ON_ERROR);
        abort_unless($result['valid'] ?? false, 409, 'لا توجد نسخة محسّنة لهذا النوع من الملفات.');
        return response()->download($documents->docx($result['revised_text']), 'bousla-improved-'.$run->id.'.docx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Cache-Control' => 'private, no-store',
        ])->deleteFileAfterSend(true);
    }

    private function result(AiToolRun $run): array
    {
        return [
            'id' => $run->id, 'kind' => $run->input['kind'], 'status' => $run->status->value,
            'created_at' => $run->created_at->toIso8601String(),
            'result' => $run->status === AiRunStatus::Success ? json_decode($run->output, true) : null,
        ];
    }
}
