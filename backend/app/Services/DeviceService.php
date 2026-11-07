<?php

namespace App\Services;

use Illuminate\Http\Request;

/**
 * استخراج بيانات الجهاز من الطلب — تغذّي شاشة "الجلسات والأجهزة النشطة".
 */
class DeviceService
{
    /** @return array{ip_address:?string, user_agent:?string, browser:string, os:string, device_type:string} */
    public function fromRequest(Request $request): array
    {
        $agent = $request->userAgent();

        return [
            'ip_address' => $request->ip(),
            'user_agent' => $agent,
            'browser' => $this->browser($agent),
            'os' => $this->os($agent),
            'device_type' => $this->deviceType($agent),
        ];
    }

    private function browser(?string $agent): string
    {
        return match (true) {
            $agent === null => 'متصفح غير معروف',
            (bool) preg_match('/Edg\//i', $agent) => 'Edge',
            (bool) preg_match('/OPR\/|Opera/i', $agent) => 'Opera',
            (bool) preg_match('/Chrome\//i', $agent) => 'Chrome',
            (bool) preg_match('/Firefox\//i', $agent) => 'Firefox',
            (bool) preg_match('/Safari\//i', $agent) => 'Safari',
            default => 'متصفح غير معروف',
        };
    }

    private function os(?string $agent): string
    {
        return match (true) {
            $agent === null => 'نظام غير معروف',
            (bool) preg_match('/iPhone|iPad|iPod/i', $agent) => 'iOS',
            (bool) preg_match('/Android/i', $agent) => 'Android',
            (bool) preg_match('/Windows/i', $agent) => 'Windows',
            (bool) preg_match('/Mac OS X/i', $agent) => 'macOS',
            (bool) preg_match('/Linux/i', $agent) => 'Linux',
            default => 'نظام غير معروف',
        };
    }

    private function deviceType(?string $agent): string
    {
        return match (true) {
            $agent === null => 'desktop',
            (bool) preg_match('/iPad|Tablet/i', $agent) => 'tablet',
            (bool) preg_match('/Mobi|Android|iPhone|iPod/i', $agent) => 'mobile',
            default => 'desktop',
        };
    }
}
