<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(): JsonResponse
    {
        $total = Notification::count();
        $unread = Notification::unread()->count();

        $recent = Notification::with('user:id,name')
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn (Notification $n) => [
                'id' => $n->id,
                'title' => $n->title,
                'type_label' => $n->type->label(),
                'user_name' => $n->user->name,
                'is_read' => $n->read_at !== null,
                'created_at' => $n->created_at,
            ]);

        return response()->json([
            'data' => $recent,
            'meta' => [
                'total' => $total,
                'unread' => $unread,
                'read_rate' => $total > 0 ? round(($total - $unread) / $total * 100, 1) : 0,
                'students_all' => User::where('role', UserRole::Student)->count(),
                'students_active' => User::where('role', UserRole::Student)
                    ->where('status', UserStatus::Active)
                    ->count(),
            ],
        ]);
    }

    /** إرسال إشعار جماعي للطلاب */
    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:200'],
            'body' => ['required', 'string', 'min:5', 'max:2000'],
            'action_label' => ['nullable', 'string', 'max:60'],
            'action_url' => ['nullable', 'string', 'max:255'],
            'audience' => ['required', 'string', 'in:all,active'],
        ]);

        $recipients = User::where('role', UserRole::Student)
            ->when($validated['audience'] === 'active', fn ($q) => $q->where('status', UserStatus::Active))
            ->pluck('id');

        if ($recipients->isEmpty()) {
            return response()->json(['message' => 'لا يوجد مستخدمون مطابقون.'], 422);
        }

        $now = now();

        Notification::insert($recipients->map(fn (int $id) => [
            'user_id' => $id,
            'type' => NotificationType::System->value,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'badge_label' => 'من المنصة',
            'action_label' => $validated['action_label'] ?? null,
            'action_url' => $validated['action_url'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all());

        $this->audit->log($request->user(), 'notification.broadcast', 'Notification', null, [
            'count' => $recipients->count(),
            'title' => $validated['title'],
        ]);

        return response()->json([
            'message' => "تم إرسال الإشعار إلى {$recipients->count()} مستخدماً.",
        ]);
    }
}
