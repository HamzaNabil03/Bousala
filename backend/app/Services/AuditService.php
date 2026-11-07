<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Request;

/** تسجيل الإجراءات الإدارية في سجل التدقيق */
class AuditService
{
    public function log(
        ?User $actor,
        string $action,
        ?string $entityType = null,
        int|string|null $entityId = null,
        array $meta = [],
    ): void {
        AuditLog::create([
            'actor_id' => $actor?->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId !== null ? (string) $entityId : null,
            'meta' => $meta ?: null,
            'ip_address' => Request::ip(),
        ]);
    }
}
