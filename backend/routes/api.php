<?php

use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\AiToolController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\GoogleAuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\CvOrderController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\Expert;
use App\Http\Controllers\Api\V1\MetaController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PresenceController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ProfileItemController;
use App\Http\Controllers\Api\V1\SavedScholarshipController;
use App\Http\Controllers\Api\V1\ScholarshipController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\ServiceRequestController;
use App\Http\Controllers\Api\V1\ShowcaseController;
use App\Http\Controllers\Api\V1\SiteMediaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| واجهة بَوْصلة البرمجية — الإصدار الأول
|--------------------------------------------------------------------------
| المصادقة بتوكنات Sanctum: كل توكن يمثّل جهازاً، وهو ما يغذّي
| شاشة "الجلسات والأجهزة النشطة" ويتيح إنهاء أي جهاز على حدة.
*/

Route::prefix('v1')->group(function (): void {

    /* ================= عام (بدون مصادقة) ================= */

    Route::get('meta', [MetaController::class, 'index'])->name('meta.index');
    Route::get('ai-tools', [AiToolController::class, 'index'])->name('ai-tools.index');
    Route::get('stats', [MetaController::class, 'stats'])->name('meta.stats');
    Route::get('site-media/{slot}', [SiteMediaController::class, 'show'])
        ->whereIn('slot', array_keys(\App\Services\SettingsService::DEFAULT_MEDIA))
        ->name('site-media.show');
    Route::post('contact', [ContactController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('contact.store');
    Route::get('services', [ServiceController::class, 'index'])->name('services.index');
    Route::get('services/{service}', [ServiceController::class, 'show'])->name('services.show');
    Route::get('services/{service}/icon', [ServiceController::class, 'icon'])->name('services.icon');
    Route::get('team-members', [ShowcaseController::class, 'team'])->name('team-members.index');
    Route::get('team-members/{teamMember}/photo', [ShowcaseController::class, 'teamPhoto'])->name('team-members.photo');
    Route::get('testimonials', [ShowcaseController::class, 'testimonials'])->name('testimonials.index');
    Route::get('testimonials/{testimonial}/photo', [ShowcaseController::class, 'testimonialPhoto'])->name('testimonials.photo');
    Route::get('admin-media/team-members/{teamMember}/photo', [Admin\TeamMemberController::class, 'photo'])
        ->middleware('signed:relative')
        ->name('admin-preview.team-members.photo');
    Route::get('admin-media/testimonials/{testimonial}/photo', [Admin\TestimonialController::class, 'photo'])
        ->middleware('signed:relative')
        ->name('admin-preview.testimonials.photo');

    Route::prefix('auth')->group(function (): void {
        Route::get('google/redirect', [GoogleAuthController::class, 'redirect'])
            ->middleware('throttle:20,1')
            ->name('auth.google.redirect');
        Route::get('google/callback', [GoogleAuthController::class, 'callback'])
            ->middleware('throttle:30,1')
            ->name('auth.google.callback');
        Route::post('google/exchange', [GoogleAuthController::class, 'exchange'])
            ->middleware('throttle:20,1')
            ->name('auth.google.exchange');
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        Route::post('verify-email', [EmailVerificationController::class, 'verify'])->middleware('throttle:10,1');
        Route::post('resend-verification', [EmailVerificationController::class, 'resend'])->middleware('throttle:4,1');
        Route::post('forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:6,1');
        Route::post('resend-code', [PasswordResetController::class, 'resend'])->middleware('throttle:6,1');
        Route::post('verify-code', [PasswordResetController::class, 'verify'])->middleware('throttle:10,1');
        Route::post('reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:6,1');
    });

    /*
     * المنح متاحة للزوار، لكن المصادقة الاختيارية تضيف
     * نسبة المطابقة وحالة الحفظ عندما يكون المستخدم مسجّلاً.
     */
    Route::middleware('auth.optional')->group(function (): void {
        Route::get('scholarships', [ScholarshipController::class, 'index'])->name('scholarships.index');
        Route::get('scholarships/featured', [ScholarshipController::class, 'featured'])->name('scholarships.featured');
        Route::get('scholarships/facets', [ScholarshipController::class, 'facets'])->name('scholarships.facets');
        Route::get('scholarships/{scholarship}', [ScholarshipController::class, 'show'])->name('scholarships.show');
    });

    /* ================= يتطلّب تسجيل دخول ================= */

    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {

        /* ---- الحساب والجلسات ---- */
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::post('presence/heartbeat', [PresenceController::class, 'heartbeat'])->name('presence.heartbeat');
        Route::post('presence/offline', [PresenceController::class, 'offline'])->name('presence.offline');
        Route::get('auth/verification-status', [EmailVerificationController::class, 'status'])
            ->name('auth.verification-status');

        Route::get('sessions', [SessionController::class, 'index'])->name('sessions.index');
        Route::delete('sessions/all', [SessionController::class, 'destroyAll'])->name('sessions.destroy-all');
        Route::delete('sessions/{token}', [SessionController::class, 'destroy'])->name('sessions.destroy');

        /* ---- لوحة الطالب ---- */
        Route::get('dashboard', [DashboardController::class, 'overview'])->name('dashboard.overview');

        /* ---- الملف الأكاديمي ---- */
        Route::get('profile', [ProfileController::class, 'show'])->name('profile.show');
        Route::get('profile/completion', [ProfileController::class, 'completion'])->name('profile.completion');
        Route::put('profile', [ProfileController::class, 'updatePersonalInfo'])->name('profile.update');

        Route::post('profile/{type}', [ProfileItemController::class, 'store'])->name('profile.items.store');
        Route::put('profile/{type}/{id}', [ProfileItemController::class, 'update'])->name('profile.items.update');
        Route::delete('profile/{type}/{id}', [ProfileItemController::class, 'destroy'])->name('profile.items.destroy');

        /* ---- المحفوظات ---- */
        Route::get('saved', [SavedScholarshipController::class, 'index'])->name('saved.index');
        Route::post('saved/{scholarship}', [SavedScholarshipController::class, 'toggle'])->name('saved.toggle');

        /* ---- المستندات ---- */
        Route::get('documents', [DocumentController::class, 'index'])->name('documents.index');
        Route::post('documents', [DocumentController::class, 'store'])->name('documents.store');
        Route::get('documents/{document}/file', [DocumentController::class, 'download'])->name('documents.file');
        Route::delete('documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

        /* ---- الإشعارات ---- */
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread');
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');

        /* ---- الإعدادات ---- */
        Route::put('settings/password', [SettingsController::class, 'updatePassword'])->name('settings.password');
        Route::put('settings/privacy', [SettingsController::class, 'updatePrivacy'])->name('settings.privacy');
        Route::put('settings/notifications', [SettingsController::class, 'updateNotifications'])->name('settings.notifications');
        Route::put('settings/locale', [SettingsController::class, 'updateLocale'])->name('settings.locale');
        Route::post('settings/deactivate', [SettingsController::class, 'deactivate'])->name('settings.deactivate');
        Route::delete('settings/account', [SettingsController::class, 'destroy'])->name('settings.destroy');

        /* ---- أدوات الذكاء الاصطناعي (التشغيل فقط؛ القائمة عامة) ---- */
        Route::post('ai-tools/{key}/run', [AiToolController::class, 'run'])
            ->middleware('throttle:20,1')
            ->name('ai-tools.run');

        Route::get('document-improvements', [\App\Http\Controllers\Api\V1\DocumentImprovementController::class, 'index']);
        Route::post('document-improvements', [\App\Http\Controllers\Api\V1\DocumentImprovementController::class, 'store'])->middleware('throttle:3,1');
        Route::get('document-improvements/{run}/file', [\App\Http\Controllers\Api\V1\DocumentImprovementController::class, 'download']);

        /* ---- طلبات صياغة السيرة الذاتية ---- */
        Route::get('cv-orders/payment-info', [CvOrderController::class, 'paymentInfo'])->name('cv-orders.payment-info');
        Route::get('cv-orders/active', [CvOrderController::class, 'active'])->name('cv-orders.active');
        Route::get('cv-orders/readiness', [CvOrderController::class, 'readiness'])->name('cv-orders.readiness');
        Route::post('cv-orders', [CvOrderController::class, 'store'])->name('cv-orders.store');
        Route::get('cv-orders/{cvOrder}', [CvOrderController::class, 'show'])->name('cv-orders.show');
        Route::post('cv-orders/{cvOrder}/notes', [CvOrderController::class, 'addNote'])->name('cv-orders.notes');
        Route::get('cv-orders/{cvOrder}/file', [CvOrderController::class, 'downloadFinal'])->name('cv-orders.file');
        Route::post('cv-orders/{cvOrder}/receipt', [CvOrderController::class, 'replaceReceipt'])->name('cv-orders.receipt');

        /* ---- الخدمات والطلبات الديناميكية ---- */
        Route::get('service-requests', [ServiceRequestController::class, 'index'])->name('service-requests.index');
        Route::post('service-requests', [ServiceRequestController::class, 'store'])->middleware('throttle:5,1')->name('service-requests.store');
        Route::get('service-requests/{serviceRequest}', [ServiceRequestController::class, 'show'])->name('service-requests.show');
        Route::get('service-requests/{serviceRequest}/attachments/{attachment}', [ServiceRequestController::class, 'download'])->name('service-requests.attachments.download');

        /* ================= لوحة الإدارة ================= */

        Route::prefix('admin')
            ->middleware('role:admin,moderator')
            ->group(function (): void {
                Route::get('dashboard', [Admin\DashboardController::class, 'index'])->name('admin.dashboard');

                Route::get('scholarships', [Admin\ScholarshipController::class, 'index'])->name('admin.scholarships.index');
                Route::post('scholarships', [Admin\ScholarshipController::class, 'store'])->name('admin.scholarships.store');
                Route::get('scholarships/{scholarship}', [Admin\ScholarshipController::class, 'show'])->name('admin.scholarships.show');
                Route::put('scholarships/{scholarship}', [Admin\ScholarshipController::class, 'update'])->name('admin.scholarships.update');
                Route::patch('scholarships/{scholarship}/status', [Admin\ScholarshipController::class, 'setStatus'])->name('admin.scholarships.status');
                Route::delete('scholarships/{scholarship}', [Admin\ScholarshipController::class, 'destroy'])->name('admin.scholarships.destroy');

                Route::get('users', [Admin\UserController::class, 'index'])->name('admin.users.index');
                Route::get('users/export', [Admin\UserController::class, 'export'])->name('admin.users.export');
                Route::patch('users/{user}/status', [Admin\UserController::class, 'setStatus'])->name('admin.users.status');
                Route::patch('users/{user}/role', [Admin\UserController::class, 'setRole'])->name('admin.users.role');

                Route::get('ai-tools', [Admin\AiToolController::class, 'index'])->name('admin.ai-tools.index');
                Route::patch('ai-tools/{aiTool}/toggle', [Admin\AiToolController::class, 'toggle'])->name('admin.ai-tools.toggle');

                Route::get('orders', [Admin\OrderController::class, 'index'])->name('admin.orders.index');
                Route::patch('orders/{cvOrder}/advance', [Admin\OrderController::class, 'advance'])->name('admin.orders.advance');
                Route::get('orders/{cvOrder}/source', [Admin\OrderController::class, 'downloadSource'])->name('admin.orders.source');
                Route::get('orders/{cvOrder}/receipt', [Admin\OrderController::class, 'downloadReceipt'])->name('admin.orders.receipt');
                Route::post('orders/{cvOrder}/payment', [Admin\OrderController::class, 'reviewPayment'])->name('admin.orders.payment');
                Route::post('orders/{cvOrder}/deliver', [Admin\OrderController::class, 'deliver'])->name('admin.orders.deliver');
                Route::delete('orders/{cvOrder}', [Admin\OrderController::class, 'destroy'])->name('admin.orders.destroy');
                // المحذوف خارج نطاق ربط النموذج، فيُستقبل رقمه ويُجلب من المحذوفات
                Route::post('orders/{cvOrder}/restore', [Admin\OrderController::class, 'restore'])->name('admin.orders.restore');

                Route::get('services', [Admin\ServiceController::class, 'index'])->name('admin.services.index');
                Route::post('services', [Admin\ServiceController::class, 'store'])->name('admin.services.store');
                Route::get('services/{service}', [Admin\ServiceController::class, 'show'])->name('admin.services.show');
                Route::put('services/{service}', [Admin\ServiceController::class, 'update'])->name('admin.services.update');
                Route::patch('services/{service}/toggle', [Admin\ServiceController::class, 'toggle'])->name('admin.services.toggle');
                Route::delete('services/{service}', [Admin\ServiceController::class, 'destroy'])->name('admin.services.destroy');

                Route::get('team-members', [Admin\TeamMemberController::class, 'index'])->name('admin.team-members.index');
                Route::post('team-members', [Admin\TeamMemberController::class, 'store'])->name('admin.team-members.store');
                Route::put('team-members/{teamMember}', [Admin\TeamMemberController::class, 'update'])->name('admin.team-members.update');
                Route::delete('team-members/{teamMember}', [Admin\TeamMemberController::class, 'destroy'])->name('admin.team-members.destroy');

                Route::get('testimonials', [Admin\TestimonialController::class, 'index'])->name('admin.testimonials.index');
                Route::post('testimonials', [Admin\TestimonialController::class, 'store'])->name('admin.testimonials.store');
                Route::put('testimonials/{testimonial}', [Admin\TestimonialController::class, 'update'])->name('admin.testimonials.update');
                Route::delete('testimonials/{testimonial}', [Admin\TestimonialController::class, 'destroy'])->name('admin.testimonials.destroy');

                Route::get('service-requests', [Admin\ServiceRequestController::class, 'index'])->name('admin.service-requests.index');
                Route::get('service-requests/{serviceRequest}', [Admin\ServiceRequestController::class, 'show'])->name('admin.service-requests.show');
                Route::patch('service-requests/{serviceRequest}/status', [Admin\ServiceRequestController::class, 'updateStatus'])->name('admin.service-requests.status');
                Route::patch('service-requests/{serviceRequest}/payment', [Admin\ServiceRequestController::class, 'reviewPayment'])->name('admin.service-requests.payment');
                Route::put('service-requests/{serviceRequest}/notes', [Admin\ServiceRequestController::class, 'updateNotes'])->name('admin.service-requests.notes');
                Route::post('service-requests/{serviceRequest}/deliver', [Admin\ServiceRequestController::class, 'deliver'])->name('admin.service-requests.deliver');
                Route::get('service-requests/{serviceRequest}/attachments/{attachment}', [Admin\ServiceRequestController::class, 'download'])->name('admin.service-requests.attachments.download');

                Route::get('notifications', [Admin\NotificationController::class, 'index'])->name('admin.notifications.index');
                Route::post('notifications/broadcast', [Admin\NotificationController::class, 'broadcast'])->name('admin.notifications.broadcast');

                Route::get('contact-messages', [Admin\ContactMessageController::class, 'index'])->name('admin.contact-messages.index');
                Route::get('contact-messages/{contactMessage}', [Admin\ContactMessageController::class, 'show'])->name('admin.contact-messages.show');

                Route::get('reports', [Admin\ReportController::class, 'index'])->name('admin.reports');
                Route::get('settings', [Admin\SettingsController::class, 'index'])->name('admin.settings');
                Route::put('settings/payment', [Admin\SettingsController::class, 'updatePayment'])->name('admin.settings.payment');
                Route::get('site-settings', [Admin\SiteSettingsController::class, 'index'])->name('admin.site-settings.index');
                Route::post('site-settings', [Admin\SiteSettingsController::class, 'update'])->name('admin.site-settings.update');
                Route::post('site-settings/media/{slot}/restore', [Admin\SiteSettingsController::class, 'restore'])
                    ->whereIn('slot', array_keys(\App\Services\SettingsService::DEFAULT_MEDIA))
                    ->name('admin.site-settings.media.restore');
            });

        /* ================= مساحة عمل الخبير ================= */

        Route::prefix('expert')
            ->middleware('role:expert')
            ->group(function (): void {
                Route::get('orders', [Expert\OrderController::class, 'index'])->name('expert.orders.index');
                Route::get('orders/{cvOrder}', [Expert\OrderController::class, 'show'])->name('expert.orders.show');
                Route::get('orders/{cvOrder}/source', [Expert\OrderController::class, 'downloadSource'])->name('expert.orders.source');
                Route::post('orders/{cvOrder}/deliver', [Expert\OrderController::class, 'deliver'])->name('expert.orders.deliver');
                Route::patch('orders/{cvOrder}/advance', [Expert\OrderController::class, 'advance'])->name('expert.orders.advance');
            });
    });
});
