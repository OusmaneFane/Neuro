<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\EpisodeResource;
use App\Http\Resources\PatientResource;
use App\Models\ShareToken;
use Illuminate\Http\JsonResponse;

class ShareViewController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $shareToken = ShareToken::where('token', $token)->first();

        if (! $shareToken || $shareToken->isExpired()) {
            return response()->json(['message' => 'Invalid or expired token.'], 404);
        }

        $patient = $shareToken->patient;

        $data = [
            'patient' => new PatientResource($patient),
        ];

        if ($shareToken->scope->value === 'SUMMARY') {
            $data['episodes_summary'] = $patient->episodes()->latest('start_date')->take(5)->get()->map(fn ($e) => [
                'id' => $e->id,
                'type' => $e->type->value,
                'start_date' => $e->start_date?->format('Y-m-d'),
                'reason' => $e->reason,
            ]);
        } else {
            $data['episodes'] = EpisodeResource::collection($patient->episodes);
            $data['documents'] = DocumentResource::collection($patient->documents);
        }

        return response()->json($data);
    }
}
