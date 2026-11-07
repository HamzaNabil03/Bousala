<?php

namespace App\Services;

use App\Enums\CvOrderKind;
use App\Models\AppSetting;
use Illuminate\Support\Facades\Cache;

/**
 * الإعدادات التي يضبطها المدير من اللوحة: أسعار الخدمات وبيانات التحويل.
 *
 * تُقرأ في كل طلب خدمة تقريباً، فتُحفظ في الذاكرة المؤقتة وتُبطَل عند الكتابة.
 */
class SettingsService
{
    public const SITE = 'site';

    public const SOCIAL = 'social';

    public const MEDIA = 'site_media';

    public const PRICING = 'pricing';

    public const PAYMENT = 'payment';

    private const CACHE_TTL = 3600;

    public const DEFAULT_SOCIAL = [
        'facebook' => null,
        'instagram' => null,
        'linkedin' => null,
        'youtube' => null,
        'tiktok' => null,
        'telegram' => null,
        'x' => null,
    ];

    public const DEFAULT_MEDIA = [
        'hero' => [
            'path' => null,
            'url' => '/images/landing/hero-1397.jpg',
            'srcset' => '/images/landing/hero-640.jpg 640w, /images/landing/hero-1024.jpg 1024w, /images/landing/hero-1397.jpg 1397w',
            'width' => 1397,
            'height' => 768,
        ],
        'cta' => [
            'path' => null,
            'url' => '/images/landing/cta-1376.jpg',
            'srcset' => '/images/landing/cta-640.jpg 640w, /images/landing/cta-1024.jpg 1024w, /images/landing/cta-1376.jpg 1376w',
            'width' => 1376,
            'height' => 768,
        ],
        'logo' => ['path' => null, 'url' => '/logo.png', 'width' => 800, 'height' => 800],
        'favicon' => ['path' => null, 'url' => '/logo.png', 'width' => 800, 'height' => 800],
    ];

    /** خدمة سعرها صفر تبقى مجانية: لا تحويل ولا إشعار ولا انتظار موافقة */
    public const DEFAULT_PRICING = [
        'currency' => 'ILS',
        'cv_build' => 0,
        'cv_improve' => 0,
        'letter_improve' => 0,
        'letter_build' => 0,
    ];

    public const DEFAULT_PAYMENT = [
        'account_holder' => null,
        'bank_name' => null,
        'account_number' => null,
        'iban' => null,
        'instructions' => null,
    ];

    /** @return array<string, mixed> */
    public function site(): array
    {
        $configured = config('menhity.site', []);

        return $this->get(self::SITE, [
            'name' => $configured['name'] ?? 'بَوْصلة',
            'name_en' => $configured['name_en'] ?? 'Bousla',
            'tagline' => $configured['tagline'] ?? null,
            'description' => $configured['description'] ?? null,
            'contact_email' => $configured['email'] ?? null,
            'secondary_email' => null,
            'phone' => $configured['phone'] ?? null,
            'whatsapp' => null,
            'address' => $configured['address'] ?? null,
            'working_hours' => null,
            'footer_description' => $configured['description'] ?? null,
            'copyright_text' => null,
        ]);
    }

    /** @return array<string, string|null> */
    public function social(): array
    {
        return $this->get(self::SOCIAL, self::DEFAULT_SOCIAL);
    }

    /** @return array<string, array<string, mixed>> */
    public function media(): array
    {
        $stored = $this->get(self::MEDIA);
        $media = [];

        foreach (self::DEFAULT_MEDIA as $slot => $default) {
            $item = array_merge($default, is_array($stored[$slot] ?? null) ? $stored[$slot] : []);

            if (filled($item['path'] ?? null)) {
                $version = urlencode((string) ($item['updated_at'] ?? '1'));
                $item['url'] = url("/api/v1/site-media/{$slot}?v={$version}");
                $item['srcset'] = null;
            }

            $media[$slot] = $item;
        }

        return $media;
    }

    /** البيانات العامة فقط؛ لا تُكشف مسارات التخزين الداخلية. */
    public function publicSite(): array
    {
        $site = $this->site();
        $site['email'] = $site['contact_email'] ?? null;
        $site['social'] = collect($this->social())->filter()->all();
        $site['media'] = collect($this->media())->map(fn (array $item) => collect($item)
            ->except(['path', 'previous_path', 'original_name', 'mime', 'size'])
            ->all())->all();

        return $site;
    }

    /** @return array<string, mixed> */
    public function pricing(): array
    {
        return $this->get(self::PRICING, self::DEFAULT_PRICING);
    }

    /** @return array<string, mixed> */
    public function payment(): array
    {
        return $this->get(self::PAYMENT, self::DEFAULT_PAYMENT);
    }

    public function currency(): string
    {
        return $this->pricing()['currency'] ?? 'ILS';
    }

    /** سعر خدمة بعينها — صفر يعني مجانية */
    public function priceFor(CvOrderKind $kind): float
    {
        return (float) ($this->pricing()[$kind->value] ?? 0);
    }

    /**
     * بيانات الحساب ناقصة ما لم يُملأ رقم الحساب أو الآيبان.
     * بدونها لا يعرف الطالب إلى أين يحوّل، فالخدمة المدفوعة لا تُطلب.
     */
    public function hasPaymentDetails(): bool
    {
        $payment = $this->payment();

        return filled($payment['account_number'] ?? null) || filled($payment['iban'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $default
     * @return array<string, mixed>
     */
    public function get(string $key, array $default = []): array
    {
        $stored = Cache::remember(
            $this->cacheKey($key),
            self::CACHE_TTL,
            fn () => AppSetting::where('key', $key)->value('value') ?? [],
        );

        // الدمج لا الاستبدال: مفتاح أُضيف بعد آخر حفظ يأخذ قيمته الافتراضية
        return array_merge($default, is_array($stored) ? $stored : []);
    }

    /**
     * @param  array<string, mixed>  $value
     * @return array<string, mixed>
     */
    public function put(string $key, array $value): array
    {
        AppSetting::updateOrCreate(['key' => $key], ['value' => $value]);

        Cache::forget($this->cacheKey($key));

        return $value;
    }

    private function cacheKey(string $key): string
    {
        return "menhity.settings.{$key}";
    }
}
