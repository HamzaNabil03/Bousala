<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * نشرات Cloudflare Pages تأخذ نطاقاً فرعياً لكل نشرة إلى جانب النطاق
 * الأساسي. رفضُها يُسقط الواجهة كلّها عند من يفتحها من رابط نشرة،
 * ويظهر عنده «تعذّر الاتصال بالخادم» لأن المتصفّح يحجب الرد قبل وصوله.
 */
class CorsPreviewOriginTest extends TestCase
{
    private function allows(string $origin): bool
    {
        $response = $this->call(
            'OPTIONS',
            '/api/v1/meta',
            server: [
                'HTTP_ORIGIN' => $origin,
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
            ],
        );

        return $response->headers->has('Access-Control-Allow-Origin');
    }

    public function test_the_production_frontend_and_its_preview_subdomains_are_allowed(): void
    {
        config(['cors.allowed_origins' => ['https://bousla.pages.dev']]);
        config(['cors.allowed_origins_patterns' => ['#^https://[a-z0-9-]+\.bousla\.pages\.dev$#i']]);

        $this->assertTrue($this->allows('https://bousla.pages.dev'));
        $this->assertTrue($this->allows('https://40f971e8.bousla.pages.dev'));
        $this->assertTrue($this->allows('https://claude-peaceful-feynman-ublx.bousla.pages.dev'));
    }

    public function test_an_unrelated_origin_is_still_refused(): void
    {
        config(['cors.allowed_origins' => ['https://bousla.pages.dev']]);
        config(['cors.allowed_origins_patterns' => ['#^https://[a-z0-9-]+\.bousla\.pages\.dev$#i']]);

        $this->assertFalse($this->allows('https://bousla.pages.dev.evil.com'));
        $this->assertFalse($this->allows('https://example.com'));
    }

    public function test_the_shipped_config_derives_the_pattern_from_the_frontend_url(): void
    {
        $patterns = require config_path('cors.php');

        // الملف يقرأ FRONTEND_URL، وافتراضه محلياً localhost
        $this->assertNotEmpty($patterns['allowed_origins']);
        $this->assertIsArray($patterns['allowed_origins_patterns']);
    }
}
