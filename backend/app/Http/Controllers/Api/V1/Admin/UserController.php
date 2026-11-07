<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::with('profile');

        if ($search = $request->string('q')->trim()->value()) {
            $like = '%'.mb_strtolower($search).'%';
            $query->where(fn (Builder $q) => $q
                ->whereRaw('LOWER(name) LIKE ?', [$like])
                ->orWhereRaw('LOWER(email) LIKE ?', [$like]));
        }

        if ($role = $request->string('role')->value()) {
            $query->where('role', $role);
        }

        if ($status = $request->string('status')->value()) {
            $query->where('status', $status);
        }

        $page = $query->latest()->paginate(config('menhity.pagination.admin'))->withQueryString();

        return response()->json([
            'data' => AdminUserResource::collection($page)->resolve(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
                'stats' => [
                    'total' => User::count(),
                    'active' => User::where('status', UserStatus::Active)->count(),
                    'online' => max(1, User::where('status', UserStatus::Active)
                        ->where('last_seen_at', '>=', now()->subMinute())
                        ->count()),
                    'suspended' => User::where('status', UserStatus::Suspended)->count(),
                    'new_this_week' => User::where('created_at', '>=', now()->subWeek())->count(),
                ],
            ],
        ]);
    }

    /** إيقاف حساب أو إعادة تفعيله */
    public function setStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(UserStatus::class)],
            'reason' => ['nullable', 'string', 'max:200'],
        ]);

        abort_if($user->id === $request->user()->id, 422, 'لا يمكنك تغيير حالة حسابك بنفسك.');

        $status = UserStatus::from($validated['status']);

        $user->update([
            'status' => $status,
            'suspended_at' => $status === UserStatus::Suspended ? now() : null,
            'suspension_reason' => $status === UserStatus::Suspended
                ? ($validated['reason'] ?: 'مخالفة سياسة الاستخدام')
                : null,
        ]);

        // إيقاف الحساب يُنهي كل جلساته فوراً
        if ($status === UserStatus::Suspended) {
            $user->tokens()->delete();
        }

        $this->audit->log($request->user(), 'user.status', 'User', $user->id, [
            'status' => $status->value,
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json(['message' => "تم تغيير حالة الحساب إلى: {$status->label()}"]);
    }

    /** تغيير دور المستخدم — لمدير النظام فقط */
    public function setRole(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'تغيير الأدوار متاح لمدير النظام فقط.');
        abort_if($user->id === $request->user()->id, 422, 'لا يمكنك تغيير دورك بنفسك.');

        $validated = $request->validate([
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        $role = UserRole::from($validated['role']);
        $user->update(['role' => $role]);

        // ترقية المستخدم إلى خبير تُنشئ له ملفاً مهنياً
        if ($role === UserRole::Expert && ! $user->expertProfile) {
            $user->expertProfile()->create(['title_prefix' => 'د.']);
        }

        $this->audit->log($request->user(), 'user.role', 'User', $user->id, ['role' => $role->value]);

        return response()->json(['message' => "تم تغيير الدور إلى: {$role->label()}"]);
    }

    /** تصدير المستخدمين بصيغة CSV */
    public function export(Request $request): StreamedResponse
    {
        $filename = 'menhity-users-'.now()->toDateString().'.csv';

        $this->audit->log($request->user(), 'user.export', 'User', null);

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'wb');
            $safeCell = static function (mixed $value): string {
                $value = (string) ($value ?? '');

                return preg_match('/^[\x00-\x20]*[=+\-@]/u', $value) === 1
                    ? "'{$value}"
                    : $value;
            };

            // BOM حتى يفتح Excel الملف بترميز UTF-8 ويعرض العربية بشكل صحيح
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'الاسم', 'البريد الإلكتروني', 'الهاتف', 'نوع الحساب', 'الحالة',
                'الدولة', 'اكتمال الملف %', 'تاريخ التسجيل', 'آخر دخول',
            ]);

            User::with('profile')->chunk(200, function ($users) use ($handle, $safeCell): void {
                foreach ($users as $user) {
                    fputcsv($handle, array_map($safeCell, [
                        $user->name,
                        $user->email,
                        $user->phone ?? '',
                        $user->role->label(),
                        $user->status->label(),
                        $user->profile?->country ?? '',
                        $user->profile?->completion_percent ?? 0,
                        $user->created_at?->toDateString(),
                        $user->last_login_at?->toDateString() ?? '',
                    ]));
                }
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=utf-8']);
    }
}
