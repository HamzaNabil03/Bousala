<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AiToolResource;
use App\Models\AiTool;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AiToolController extends Controller
{
    public function __construct(
        private readonly AiService $ai,
        private readonly ProfileController $profiles,
    ) {}

    /** الأدوات المفعّلة مع حالة تكوين المزوّد */
    public function index(): JsonResponse
    {
        $tools = AiTool::where('is_active', true)
            ->withCount('runs')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => AiToolResource::collection($tools)->resolve(),
            'meta' => ['ai_configured' => $this->ai->isConfigured()],
        ]);
    }

    /** تشغيل أداة على ملف المستخدم */
    public function run(Request $request, string $key): JsonResponse
    {
        abort_unless(in_array($key, AiService::TOOLS, true), 404);

        $requiresText = in_array($key, AiService::TOOLS_REQUIRING_TEXT, true);

        $validated = Validator::make($request->all(), [
            'input' => [$requiresText ? 'required' : 'nullable', 'string', 'min:40', 'max:20000'],
            'target' => ['nullable', 'string', 'max:200'],
        ], [
            'input.required' => 'الصق النص المراد تحسينه.',
            'input.min' => 'النص قصير جداً — 40 حرفاً على الأقل.',
        ])->validate();

        $tool = AiTool::where('key', $key)->first();

        if ($tool && ! $tool->is_active) {
            return response()->json(['message' => 'هذه الأداة معطّلة حالياً.'], 422);
        }

        $result = $this->ai->run(
            toolKey: $key,
            profile: $this->profiles->profileFor($request->user()),
            user: $request->user(),
            userText: $validated['input'] ?? null,
            target: $validated['target'] ?? null,
        );

        if (! $result['ok']) {
            return response()->json(['message' => $result['error']], 502);
        }

        return response()->json([
            'data' => [
                'output' => $result['output'],
                'mocked' => $result['mocked'],
                'run_id' => $result['run_id'],
            ],
        ]);
    }
}
