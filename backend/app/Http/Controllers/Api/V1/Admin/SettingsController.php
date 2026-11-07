<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CvOrderKind;
use App\Http\Controllers\Controller;
use App\Models\AiToolRun;
use App\Models\AuditLog;
use App\Models\ContactMessage;
use App\Models\Document;
use App\Models\Notification;
use App\Models\PersonalAccessToken;
use App\Models\Scholarship;
use App\Models\User;
use App\Services\AiService;
use App\Services\AuditService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** معلومات التشغيل وحالة التكاملات وسجل الإجراءات */
class SettingsController extends Controller
{
    public function __construct(
        private readonly AiService $ai,
        private readonly SettingsService $settings,
        private readonly AuditService $audit,
    ) {}

    public function index(): JsonResponse
    {
        $databaseConnected = rescue(fn () => (bool) DB::connection()->getPdo(), false, false);

        $audit = AuditLog::with('actor:id,name')
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'actor_name' => $log->actor?->name ?? 'النظام',
                'action' => $log->action,
                'entity_type' => $log->entity_type,
                'entity_id' => $log->entity_id,
                'created_at' => $log->created_at,
            ]);

        return response()->json([
            'data' => [
                'site' => $this->settings->publicSite(),
                'pricing' => $this->settings->pricing(),
                'payment' => $this->settings->payment(),
                'services' => collect([CvOrderKind::CvBuild, CvOrderKind::LetterBuild])->map(fn (CvOrderKind $kind) => [
                    'kind' => $kind->value,
                    'label' => $kind->label(),
                ])->all(),
                'integrations' => [
                    [
                        'key' => 'database',
                        'name' => 'قاعدة البيانات (PostgreSQL)',
                        'ok' => $databaseConnected,
                        'note' => $databaseConnected ? 'متصلة وتعمل' : 'تعذّر الاتصال',
                    ],
                    [
                        'key' => 'ai',
                        'name' => 'مزوّد الذكاء الاصطناعي',
                        'ok' => $this->ai->isConfigured(),
                        'note' => $this->ai->providerName()
                            ?? 'وضع المحاكاة — لم يُضبط مفتاح أي مزوّد',
                    ],
                    [
                        'key' => 'mail',
                        'name' => 'خدمة البريد الإلكتروني',
                        'ok' => config('mail.default') !== 'log',
                        'note' => config('mail.default') === 'log'
                            ? 'غير مربوطة — رموز التحقق تُسجَّل في سجل الخادم'
                            : 'مربوطة عبر '.config('mail.default'),
                    ],
                    [
                        'key' => 'oauth',
                        'name' => 'تسجيل الدخول الخارجي (Google / Apple)',
                        'ok' => false,
                        'note' => 'غير مفعّل — يحتاج بيانات اعتماد OAuth',
                    ],
                ],
                'data_sizes' => [
                    ['label' => 'المستخدمون', 'value' => User::count()],
                    ['label' => 'المنح', 'value' => Scholarship::count()],
                    ['label' => 'المستندات', 'value' => Document::count()],
                    ['label' => 'الإشعارات', 'value' => Notification::count()],
                    ['label' => 'تشغيلات الأدوات', 'value' => AiToolRun::count()],
                ],
                'active_sessions' => PersonalAccessToken::where(
                    fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()),
                )->count(),
                'unread_messages' => ContactMessage::where('is_read', false)->count(),
                'audit_log' => $audit,
            ],
        ]);
    }

    /**
     * ضبط أسعار الخدمات وبيانات الحساب الذي يحوّل إليه الطلاب.
     * سعر صفر يُبقي الخدمة مجانية بلا تحويل ولا انتظار موافقة.
     */
    public function updatePayment(Request $request): JsonResponse
    {
        $rules = [
            'currency' => ['required', 'string', 'max:8'],
            'account_holder' => ['nullable', 'string', 'max:120'],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'account_number' => ['nullable', 'string', 'max:64'],
            'iban' => ['nullable', 'string', 'max:64'],
            'instructions' => ['nullable', 'string', 'max:2000'],
        ];

        foreach ([CvOrderKind::CvBuild, CvOrderKind::LetterBuild] as $kind) {
            $rules["prices.{$kind->value}"] = ['required', 'numeric', 'min:0', 'max:100000'];
        }

        $validated = $request->validate($rules, [
            'currency.required' => 'اكتب رمز العملة.',
        ]);

        $pricing = ['currency' => $validated['currency']];

        foreach ([CvOrderKind::CvBuild, CvOrderKind::LetterBuild] as $kind) {
            $pricing[$kind->value] = (float) $validated['prices'][$kind->value];
        }

        $this->settings->put(SettingsService::PRICING, $pricing);

        $payment = $this->settings->put(SettingsService::PAYMENT, [
            'account_holder' => $validated['account_holder'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'account_number' => $validated['account_number'] ?? null,
            'iban' => $validated['iban'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
        ]);

        $this->audit->log($request->user(), 'settings.payment', 'AppSetting', null, [
            'currency' => $pricing['currency'],
        ]);

        return response()->json([
            'message' => 'تم حفظ الأسعار وبيانات التحويل.',
            'data' => ['pricing' => $pricing, 'payment' => $payment],
        ]);
    }
}
