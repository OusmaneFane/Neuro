<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClinicalNoteResource;
use App\Models\ClinicalNote;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ClinicalNoteController extends Controller
{
    public function index(Patient $patient): AnonymousResourceCollection
    {
        $this->authorize('view', $patient);

        $notes = $patient->clinicalNotes()->with(['creator:id,full_name', 'updater:id,full_name'])->paginate(20);

        return ClinicalNoteResource::collection($notes);
    }

    public function store(Request $request, Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:10000'],
        ]);

        $note = $patient->clinicalNotes()->create([
            'content' => $validated['content'],
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        return response()->json(new ClinicalNoteResource($note->load('creator:id,full_name')), 201);
    }

    public function destroy(Patient $patient, ClinicalNote $clinicalNote): JsonResponse
    {
        $this->authorize('view', $patient);

        if ($clinicalNote->patient_id !== $patient->id) {
            abort(404);
        }

        $clinicalNote->delete(); // soft delete (deleted_at + deleted_by set in model)

        return response()->json(null, 204);
    }
}
