<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentServiceResource;
use App\Models\StudentService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ServiceController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return StudentServiceResource::collection(
            StudentService::visible()->with(['category', 'fields'])
                ->where(fn ($query) => $query->whereNull('system_key')->orWhere('system_key', '!=', 'scholarship_application'))
                ->get(),
        );
    }

    public function show(StudentService $service): StudentServiceResource
    {
        abort_unless($service->is_active, 404);
        return new StudentServiceResource($service->load(['category', 'fields']));
    }

    public function icon(StudentService $service): StreamedResponse
    {
        abort_unless($service->image_path && Storage::disk('public')->exists($service->image_path), 404);
        return Storage::disk('public')->response($service->image_path);
    }
}
