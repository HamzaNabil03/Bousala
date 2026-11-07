<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DocumentKind;
use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return DocumentResource::collection(
            $request->user()->documents()->latest()->get(),
        );
    }

    /** رفع مستند جديد */
    public function store(Request $request): DocumentResource
    {
        $maxKilobytes = (int) (config('menhity.uploads.max_bytes') / 1024);
        $mimes = implode(',', config('menhity.uploads.mimes'));

        $validated = $request->validate([
            'file' => ['required', 'file', "max:{$maxKilobytes}", "mimes:{$mimes}"],
            'kind' => ['required', Rule::enum(DocumentKind::class)],
        ]);

        $file = $validated['file'];

        // اسم مخزّن عشوائي يمنع تضارب الأسماء وتجاوز المسار
        $path = $file->store('documents', 'local');

        $document = $request->user()->documents()->create([
            'kind' => $validated['kind'],
            'original_name' => $file->getClientOriginalName(),
            'stored_name' => basename($path),
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => $file->getSize(),
            'path' => $path,
        ]);

        return new DocumentResource($document);
    }

    /** تنزيل مستند خاص بعد التحقق من ملكيته */
    public function download(Request $request, Document $document): StreamedResponse
    {
        abort_unless($document->user_id === $request->user()->id, 404);
        $disk = Storage::disk('local')->exists($document->path) ? 'local' : 'public';
        abort_unless(Storage::disk($disk)->exists($document->path), 404);

        return Storage::disk($disk)->download($document->path, $document->original_name, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** حذف مستند */
    public function destroy(Request $request, Document $document): JsonResponse
    {
        abort_unless($document->user_id === $request->user()->id, 403);

        Storage::disk('local')->delete($document->path);
        Storage::disk('public')->delete($document->path);
        $document->delete();

        return response()->json(['message' => 'تم حذف المستند.']);
    }
}
