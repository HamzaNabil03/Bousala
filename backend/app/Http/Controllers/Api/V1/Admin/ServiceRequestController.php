<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestAttachment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ServiceRequestController extends Controller
{
    private const STATUSES = ['pending_review', 'awaiting_payment_verification', 'payment_verified', 'in_progress', 'completed', 'rejected', 'cancelled'];
    private const PAYMENTS = ['pending_verification', 'verified', 'rejected', 'not_required'];
    private const RELATIONS = ['service', 'scholarship', 'responses', 'attachments', 'history.actor:id,name'];

    public function index(Request $request): JsonResponse
    {
        $query = ServiceRequest::with(['service', 'scholarship'])
            ->when($request->string('q')->trim()->value(), fn (Builder $q, string $term) => $q->where(fn (Builder $inner) => $inner->where('reference_number', 'like', "%{$term}%")->orWhere('student_name', 'like', "%{$term}%")->orWhere('student_email', 'like', "%{$term}%")))
            ->when($request->string('status')->value(), fn (Builder $q, string $value) => $q->where('status', $value))
            ->when($request->string('payment_status')->value(), fn (Builder $q, string $value) => $q->where('payment_status', $value))
            ->when($request->integer('service_id'), fn (Builder $q, int $value) => $q->where('service_id', $value));
        match ($request->string('sort')->value()) {
            'oldest' => $query->oldest(),
            'price_high' => $query->orderByDesc('price_snapshot'),
            'price_low' => $query->orderBy('price_snapshot'),
            default => $query->latest(),
        };
        $page = $query->paginate(20);
        return response()->json(['data' => ServiceRequestResource::collection($page)->resolve(), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()]]);
    }

    public function show(ServiceRequest $serviceRequest): ServiceRequestResource
    {
        return new ServiceRequestResource($serviceRequest->load(self::RELATIONS));
    }

    public function updateStatus(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(self::STATUSES)], 'note' => ['nullable', 'string', 'max:2000']]);
        $from = $serviceRequest->status;
        $serviceRequest->update(['status' => $data['status'], 'completed_at' => $data['status'] === 'completed' ? now() : null]);
        $serviceRequest->history()->create(['actor_id' => $request->user()->id, 'event' => 'status_changed', 'from_value' => $from, 'to_value' => $data['status'], 'note' => $data['note'] ?? null]);
        return response()->json(['message' => 'تم تحديث حالة الطلب.', 'data' => (new ServiceRequestResource($serviceRequest->fresh()->load(self::RELATIONS)))->resolve()]);
    }

    public function reviewPayment(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $data = $request->validate(['payment_status' => ['required', Rule::in(['verified', 'rejected'])], 'note' => ['nullable', 'string', 'max:1000']]);
        abort_if($serviceRequest->payment_status === 'not_required', 422, 'هذا الطلب لا يحتاج دفعة.');
        $from = $serviceRequest->payment_status;
        $status = $data['payment_status'] === 'verified' ? 'payment_verified' : 'awaiting_payment_verification';
        $serviceRequest->update(['payment_status' => $data['payment_status'], 'status' => $status]);
        $serviceRequest->history()->create(['actor_id' => $request->user()->id, 'event' => 'payment_reviewed', 'from_value' => $from, 'to_value' => $data['payment_status'], 'note' => $data['note'] ?? null]);
        return response()->json(['message' => 'تم تحديث حالة الدفع.', 'data' => (new ServiceRequestResource($serviceRequest->fresh()->load(self::RELATIONS)))->resolve()]);
    }

    public function updateNotes(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $data = $request->validate(['internal_notes' => ['nullable', 'string', 'max:5000']]);
        $serviceRequest->update($data);
        return response()->json(['message' => 'تم حفظ الملاحظات الداخلية.']);
    }

    public function deliver(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $data = $request->validate(['file' => ['required', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png,webp', 'max:10240']]);
        $file = $data['file']; $path = $file->storeAs("service-requests/{$serviceRequest->id}", Str::uuid().'.'.strtolower($file->getClientOriginalExtension()), 'local');
        $serviceRequest->attachments()->create(['uploaded_by' => $request->user()->id, 'kind' => 'completed', 'original_name' => $file->getClientOriginalName(), 'path' => $path, 'mime_type' => $file->getMimeType(), 'size' => $file->getSize()]);
        $from = $serviceRequest->status; $serviceRequest->update(['status' => 'completed', 'completed_at' => now()]);
        $serviceRequest->history()->create(['actor_id' => $request->user()->id, 'event' => 'delivered', 'from_value' => $from, 'to_value' => 'completed']);
        return response()->json(['message' => 'تم رفع الملف المكتمل وإغلاق الطلب.']);
    }

    public function download(ServiceRequest $serviceRequest, ServiceRequestAttachment $attachment): StreamedResponse
    {
        abort_unless($attachment->service_request_id === $serviceRequest->id, 404);
        abort_unless(Storage::disk('local')->exists($attachment->path), 404, 'الملف غير موجود.');
        return Storage::disk('local')->download($attachment->path, $attachment->original_name);
    }
}
