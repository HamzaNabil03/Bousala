<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePersonalInfoRequest;
use App\Http\Resources\StudentProfileResource;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\ProfileCompletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private readonly ProfileCompletionService $completion) {}

    /** الملف الأكاديمي كاملاً */
    public function show(Request $request): StudentProfileResource
    {
        return new StudentProfileResource($this->profileFor($request->user()));
    }

    /** حالة اكتمال الملف مفصّلة بالأقسام */
    public function completion(Request $request): JsonResponse
    {
        $profile = $this->profileFor($request->user());

        return response()->json(['data' => $this->completion->evaluate($profile)]);
    }

    /** تحديث المعلومات الشخصية */
    public function updatePersonalInfo(UpdatePersonalInfoRequest $request): StudentProfileResource
    {
        $user = $request->user();
        $profile = $this->profileFor($user);

        $data = $request->validated();

        // رقم الهاتف يُخزَّن على الحساب لا على الملف
        if (array_key_exists('phone', $data)) {
            $user->update(['phone' => $data['phone']]);
            unset($data['phone']);
        }

        $profile->update($data);
        $this->completion->refresh($user);

        return new StudentProfileResource($this->profileFor($user->fresh()));
    }

    /** يجلب الملف وينشئه إن لم يكن موجوداً */
    public function profileFor(User $user): StudentProfile
    {
        $profile = StudentProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['full_name_ar' => $user->name],
        );

        return $profile->load(StudentProfile::FULL_RELATIONS);
    }
}
