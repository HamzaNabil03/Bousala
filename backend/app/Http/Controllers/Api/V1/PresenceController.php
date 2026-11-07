<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    public function heartbeat(Request $request): JsonResponse
    {
        $request->user()->forceFill(['last_seen_at' => now()])->save();

        return response()->json(['online' => true]);
    }

    public function offline(Request $request): JsonResponse
    {
        $request->user()->forceFill(['last_seen_at' => null])->save();

        return response()->json(['online' => false]);
    }
}