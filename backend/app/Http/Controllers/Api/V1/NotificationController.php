<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\NotificationType;
use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** قائمة الإشعارات مع عدّادات التابات */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tab = $request->string('tab')->value() ?: 'all';
        $types = NotificationType::forTab($tab);

        $notifications = $user->notifications()
            ->when($types, fn ($q) => $q->whereIn('type', $types))
            ->latest()
            ->limit(50)
            ->get();

        $counts = $user->notifications()
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $countFor = function (string $tabKey) use ($counts): int {
            $list = NotificationType::forTab($tabKey);

            if (! $list) {
                return (int) $counts->sum();
            }

            return (int) collect($list)->sum(fn (string $type) => $counts[$type] ?? 0);
        };

        return response()->json([
            'data' => NotificationResource::collection($notifications)->resolve(),
            'meta' => [
                'tabs' => [
                    'all' => $countFor('all'),
                    'matches' => $countFor('matches'),
                    'deadlines' => $countFor('deadlines'),
                ],
                'unread' => $user->notifications()->unread()->count(),
            ],
        ]);
    }

    /** عدد الإشعارات غير المقروءة — يغذّي جرس النافبار */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->notifications()->unread()->count(),
        ]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 403);

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'تم تحديد الإشعار كمقروء.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->notifications()->unread()->update(['read_at' => now()]);

        return response()->json(['message' => 'تم تحديد كل الإشعارات كمقروءة.']);
    }
}
