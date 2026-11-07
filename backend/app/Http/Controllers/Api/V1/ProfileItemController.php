<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileItemRequest;
use App\Http\Resources\StudentProfileResource;
use App\Models\StudentProfile;
use App\Services\ProfileCompletionService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * إدارة عناصر الملف الأكاديمي (تعليم، خبرات، مهارات، لغات، شهادات، مشاريع، اهتمامات).
 * تُستخدم علاقة واحدة معمّمة بدل سبعة كنترولرات متطابقة.
 */
class ProfileItemController extends Controller
{
    public function __construct(
        private readonly ProfileCompletionService $completion,
        private readonly ProfileController $profiles,
    ) {}

    /** إضافة عنصر جديد */
    public function store(ProfileItemRequest $request, string $type): StudentProfileResource|JsonResponse
    {
        $profile = $this->resolveProfile($request);
        $data = $request->validated();

        if (in_array($type, ['educations', 'experiences'], true)) {
            $data['sort_order'] = $profile->{$type}()->count();
        }

        try {
            $profile->{$type}()->create($data);
        } catch (UniqueConstraintViolationException) {
            // مهارة أو لغة أو اهتمام مكرّر — الاستثناء موحّد عبر كل محرّكات قواعد البيانات
            return response()->json(['message' => 'هذا العنصر مضاف مسبقاً.'], 422);
        }

        return $this->respond($request);
    }

    /** تعديل عنصر قائم */
    public function update(ProfileItemRequest $request, string $type, int $id): StudentProfileResource
    {
        $profile = $this->resolveProfile($request);

        $item = $profile->{$type}()->whereKey($id)->firstOrFail();
        $item->update($request->validated());

        return $this->respond($request);
    }

    /** حذف عنصر */
    public function destroy(Request $request, string $type, int $id): StudentProfileResource
    {
        abort_unless(array_key_exists($type, ProfileItemRequest::TYPES), 404);

        $profile = $this->resolveProfile($request);
        $profile->{$type}()->whereKey($id)->firstOrFail()->delete();

        return $this->respond($request);
    }

    private function resolveProfile(Request $request): StudentProfile
    {
        return $this->profiles->profileFor($request->user());
    }

    /** يعيد الملف كاملاً بعد أي تعديل حتى تتحدّث الواجهة دفعة واحدة */
    private function respond(Request $request): StudentProfileResource
    {
        $user = $request->user();
        $this->completion->refresh($user);

        return new StudentProfileResource($this->profiles->profileFor($user));
    }
}
