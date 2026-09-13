<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ShareToken\StoreShareTokenRequest;
use App\Http\Resources\ShareTokenResource;
use App\Models\Patient;
use App\Models\ShareToken;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShareTokenController extends Controller
{
    public function store(StoreShareTokenRequest $request, ?Patient $patient = null): JsonResponse
    {
        $patient = $patient ?? auth()->user()?->patient;

        if (! $patient) {
            return response()->json(['message' => 'Patient not found.'], 404);
        }

        $expiresIn = match ($request->input('expires_in')) {
            '1h' => Carbon::now()->addHour(),
            '24h' => Carbon::now()->addDay(),
            '7d' => Carbon::now()->addDays(7),
            default => Carbon::now()->addHour(),
        };

        $token = ShareToken::create([
            'token' => ShareToken::generateToken(),
            'patient_id' => $patient->id,
            'expires_at' => $expiresIn,
            'scope' => $request->input('scope'),
            'created_by' => auth()->id(),
        ]);

        return response()->json(new ShareTokenResource($token), 201);
    }
}
