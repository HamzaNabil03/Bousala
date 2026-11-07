<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

/**
 * رسائل "تواصل معنا" العامة — أي زائر يرسلها بلا حاجة لحساب، فلا صاحب
 * لها يقرؤها إلا من هنا. كانت تُحفظ بلا أي واجهة تعرضها: عدّاد "غير
 * مقروءة" في إعدادات المنصة يُحصيها ولا يوصل إليها.
 */
class ContactMessageController extends Controller
{
    public function index(): JsonResponse
    {
        // ترتيب بالوقت وحده يتعادل عند رسالتين بالثانية نفسها؛ المعرّف كاسر تعادل ثابت
        $messages = ContactMessage::latest()->latest('id')->limit(50)->get();

        return response()->json([
            'data' => $messages,
            'meta' => [
                'total' => ContactMessage::count(),
                'unread' => ContactMessage::where('is_read', false)->count(),
            ],
        ]);
    }

    /** فتح الرسالة يُعلِمها مقروءة — لا زرّ منفصل لتعليمها */
    public function show(ContactMessage $contactMessage): JsonResponse
    {
        if (! $contactMessage->is_read) {
            $contactMessage->update(['is_read' => true]);
        }

        return response()->json(['data' => $contactMessage]);
    }
}
