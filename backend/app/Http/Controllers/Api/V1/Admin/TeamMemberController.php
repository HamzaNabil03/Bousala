<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamMemberResource;
use App\Models\TeamMember;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class TeamMemberController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(): JsonResponse
    {
        $items = TeamMember::orderBy('display_order')->orderBy('id')->get();
        return response()->json(['data' => TeamMemberResource::collection($items)->resolve()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $member = TeamMember::create(collect($data)->except(['photo', 'remove_photo'])->all());
        $this->syncPhoto($request, $member);
        $this->afterWrite($request, 'team_member.created', $member);
        return response()->json(['message' => 'تمت إضافة عضو الفريق.', 'data' => (new TeamMemberResource($member->fresh()))->resolve()], 201);
    }

    public function update(Request $request, TeamMember $teamMember): JsonResponse
    {
        $data = $this->validated($request);
        $teamMember->update(collect($data)->except(['photo', 'remove_photo'])->all());
        $this->syncPhoto($request, $teamMember);
        $this->afterWrite($request, 'team_member.updated', $teamMember);
        return response()->json(['message' => 'تم حفظ بيانات عضو الفريق.', 'data' => (new TeamMemberResource($teamMember->fresh()))->resolve()]);
    }

    public function destroy(Request $request, TeamMember $teamMember): JsonResponse
    {
        $id = $teamMember->id;
        $this->deletePhoto($teamMember);
        $teamMember->delete();
        Cache::forget(TeamMember::PUBLIC_CACHE_KEY);
        $this->audit->log($request->user(), 'team_member.deleted', TeamMember::class, $id);
        return response()->json(['message' => 'تم حذف عضو الفريق.']);
    }

    public function photo(TeamMember $teamMember): StreamedResponse
    {
        abort_unless($teamMember->photo_path && Storage::disk('site_media')->exists($teamMember->photo_path), 404);
        return Storage::disk('site_media')->response($teamMember->photo_path, null, ['Cache-Control' => 'private, max-age=300', 'X-Content-Type-Options' => 'nosniff']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'role' => ['required', 'string', 'min:2', 'max:160'],
            'biography' => ['nullable', 'string', 'max:1200'],
            'linkedin_url' => ['nullable', 'url:http,https', 'max:255'],
            'github_url' => ['nullable', 'url:http,https', 'max:255'],
            'facebook_url' => ['nullable', 'url:http,https', 'max:255'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'display_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'is_visible' => ['required', 'boolean'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:min_width=200,min_height=200'],
            'remove_photo' => ['sometimes', 'boolean'],
        ]);
    }

    private function syncPhoto(Request $request, TeamMember $member): void
    {
        if ($request->boolean('remove_photo') && ! $request->hasFile('photo')) $this->deletePhoto($member);
        if (! $request->hasFile('photo')) return;
        $this->deletePhoto($member);
        $file = $request->file('photo');
        try {
            $path = $file->storeAs('team-members', Str::uuid().'.'.strtolower($file->getClientOriginalExtension()), 'site_media');
        } catch (Throwable $exception) {
            report($exception);
            throw ValidationException::withMessages(['photo' => 'تعذّر حفظ الصورة. حاول مجددًا أو اختر صورة أخرى.']);
        }
        if (! $path) throw ValidationException::withMessages(['photo' => 'تعذّر حفظ الصورة. تحقق من مساحة التخزين وحاول مجددًا.']);
        $member->update(['photo_path' => $path]);
    }

    private function deletePhoto(TeamMember $member): void
    {
        if ($member->photo_path) Storage::disk('site_media')->delete($member->photo_path);
        if ($member->exists && $member->photo_path) $member->update(['photo_path' => null]);
    }

    private function afterWrite(Request $request, string $action, TeamMember $member): void
    {
        Cache::forget(TeamMember::PUBLIC_CACHE_KEY);
        $this->audit->log($request->user(), $action, TeamMember::class, $member->id, ['visible' => $member->is_visible]);
    }
}
