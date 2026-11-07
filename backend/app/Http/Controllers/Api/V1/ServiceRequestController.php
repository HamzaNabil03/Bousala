<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\Scholarship;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestAttachment;
use App\Models\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ServiceRequestController extends Controller
{
    private const RELATIONS = ['service', 'scholarship', 'responses', 'attachments', 'history'];

    public function index(HttpRequest $request): AnonymousResourceCollection
    {
        return ServiceRequestResource::collection(
            $request->user()->serviceRequests()->with(['service', 'scholarship'])->latest()->paginate(12),
        );
    }

    public function show(HttpRequest $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        $this->authorizeOwner($request, $serviceRequest);
        return new ServiceRequestResource($serviceRequest->load(self::RELATIONS));
    }

    public function store(HttpRequest $request): JsonResponse
    {
        $max = (int) (config('menhity.uploads.max_bytes') / 1024);
        $base = $request->validate([
            'submission_token' => ['required', 'uuid'],
            'service_id' => ['nullable', 'integer', 'exists:student_services,id'],
            'scholarship_id' => ['nullable', 'integer', 'exists:scholarships,id'],
            'full_name' => ['required', 'string', 'min:3', 'max:160'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['required', 'string', 'min:7', 'max:40'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'responses' => ['nullable', 'string'],
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', "max:{$max}"],
            'supporting_documents.*' => ['file', 'mimes:pdf,doc,docx,jpg,jpeg,png,webp', "max:{$max}"],
        ]);

        if ($existing = ServiceRequest::where('submission_token', $base['submission_token'])->first()) {
            abort_unless($existing->user_id === $request->user()->id, 409);
            return response()->json(['message' => 'تم استلام هذا الطلب سابقاً.', 'data' => (new ServiceRequestResource($existing->load(self::RELATIONS)))->resolve()], 200);
        }

        $scholarship = isset($base['scholarship_id']) ? Scholarship::findOrFail($base['scholarship_id']) : null;
        if ($scholarship) {
            abort_unless($scholarship->platform_application_enabled && $scholarship->platform_application_requests_enabled, 422, 'التقديم عبر المنصة غير متاح لهذه المنحة.');
            $requiredDocuments = count($scholarship->platform_application_documents ?? []);
            if ($requiredDocuments > count($request->file('supporting_documents', []))) {
                throw ValidationException::withMessages(['supporting_documents' => ['أرفق جميع المستندات الإضافية المطلوبة لهذه المنحة.']]);
            }
            $service = StudentService::where('system_key', 'scholarship_application')->where('is_active', true)->firstOrFail();
            $price = (float) $scholarship->platform_application_price;
            $currency = $scholarship->platform_application_currency;
            $serviceName = 'مساعدة التقديم: '.$scholarship->title_ar;
        } else {
            $service = StudentService::visible()->with('fields')->findOrFail($base['service_id'] ?? 0);
            $price = (float) $service->price;
            $currency = $service->currency;
            $serviceName = $service->name;
        }

        $service->loadMissing('fields');
        $responses = json_decode($base['responses'] ?? '{}', true);
        if (! is_array($responses)) {
            throw ValidationException::withMessages(['responses' => ['بيانات الحقول الإضافية غير صالحة.']]);
        }

        $fieldValues = [];
        $fieldFiles = [];
        foreach ($service->fields as $field) {
            if ($field->type === 'file') {
                $file = $request->file("field_files.{$field->key}");
                if ($field->is_required && ! $file) throw ValidationException::withMessages(["field_files.{$field->key}" => ["حقل {$field->label} مطلوب."]]);
                if ($file) {
                    Validator::make(['file' => $file], ['file' => ['file', 'mimes:pdf,doc,docx,jpg,jpeg,png,webp', "max:{$max}"]])->validate();
                    $fieldFiles[] = [$field, $file];
                }
                continue;
            }
            $value = $responses[$field->key] ?? null;
            $rules = [$field->is_required ? 'required' : 'nullable'];
            if ($field->type === 'email') $rules[] = 'email';
            elseif ($field->type === 'date') $rules[] = 'date';
            else { $rules[] = 'string'; $rules[] = 'max:5000'; }
            Validator::make(
                ['responses' => [$field->key => $value]],
                ["responses.{$field->key}" => $rules],
                [],
                ["responses.{$field->key}" => $field->label],
            )->validate();
            $fieldValues[] = [$field, is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value];
        }

        if ($price > 0 && ! $request->hasFile('receipt')) {
            throw ValidationException::withMessages(['receipt' => ['أرفق صورة إشعار الدفع ليتمكن الفريق من مراجعته يدوياً.']]);
        }

        $order = DB::transaction(function () use ($request, $base, $service, $scholarship, $price, $currency, $serviceName, $fieldValues, $fieldFiles): ServiceRequest {
            $order = ServiceRequest::create([
                'submission_token' => $base['submission_token'], 'reference_number' => ServiceRequest::generateReference(),
                'user_id' => $request->user()->id, 'service_id' => $service->id, 'scholarship_id' => $scholarship?->id,
                'student_name' => $base['full_name'], 'student_email' => $base['email'], 'student_phone' => $base['phone'], 'notes' => $base['notes'] ?? null,
                'service_name_snapshot' => $serviceName, 'price_snapshot' => $price, 'currency_snapshot' => $currency,
                'status' => $price > 0 ? 'awaiting_payment_verification' : 'pending_review',
                'payment_status' => $price > 0 ? 'pending_verification' : 'not_required', 'submitted_at' => now(),
            ]);
            foreach ($fieldValues as [$field, $value]) $order->responses()->create(['service_field_id' => $field->id, 'field_key' => $field->key, 'field_label' => $field->label, 'field_type' => $field->type, 'value' => $value]);
            foreach ($fieldFiles as [$field, $file]) $this->attach($order, $request->user()->id, $file, 'field', $field->key);
            foreach ($request->file('supporting_documents', []) as $file) $this->attach($order, $request->user()->id, $file, 'supporting');
            if ($request->hasFile('receipt')) $this->attach($order, $request->user()->id, $request->file('receipt'), 'receipt');
            $order->history()->create(['actor_id' => $request->user()->id, 'event' => 'submitted', 'to_value' => $order->status]);
            return $order;
        });

        return response()->json(['message' => 'تم استلام طلبك بنجاح!', 'data' => (new ServiceRequestResource($order->load(self::RELATIONS)))->resolve()], 201);
    }

    public function download(HttpRequest $request, ServiceRequest $serviceRequest, ServiceRequestAttachment $attachment): StreamedResponse
    {
        $this->authorizeOwner($request, $serviceRequest);
        abort_unless($attachment->service_request_id === $serviceRequest->id, 404);
        abort_unless(Storage::disk('local')->exists($attachment->path), 404, 'الملف غير موجود.');
        return Storage::disk('local')->download($attachment->path, $attachment->original_name);
    }

    private function authorizeOwner(HttpRequest $request, ServiceRequest $order): void
    {
        abort_unless($order->user_id === $request->user()->id || $request->user()->isAdminLevel(), 403);
    }

    private function attach(ServiceRequest $order, int $userId, $file, string $kind, ?string $fieldKey = null): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->storeAs("service-requests/{$order->id}", Str::uuid().'.'.$extension, 'local');
        $order->attachments()->create(['uploaded_by' => $userId, 'kind' => $kind, 'field_key' => $fieldKey, 'original_name' => $file->getClientOriginalName(), 'path' => $path, 'mime_type' => $file->getMimeType(), 'size' => $file->getSize()]);
    }
}
