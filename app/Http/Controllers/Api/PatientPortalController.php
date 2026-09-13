<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\EpisodeResource;
use App\Http\Resources\PatientResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PatientPortalController extends Controller
{
    public function me(): JsonResponse
    {
        $patient = auth()->user()->patient;

        if (! $patient) {
            return response()->json(['message' => 'Patient profile not found.'], 404);
        }

        return response()->json(new PatientResource($patient));
    }

    public function episodes(): AnonymousResourceCollection
    {
        $patient = auth()->user()->patient;

        if (! $patient) {
            abort(404, 'Patient profile not found.');
        }

        return EpisodeResource::collection($patient->episodes()->paginate(15));
    }

    public function documents(): AnonymousResourceCollection
    {
        $patient = auth()->user()->patient;

        if (! $patient) {
            abort(404, 'Patient profile not found.');
        }

        return DocumentResource::collection($patient->documents()->paginate(15));
    }
}
