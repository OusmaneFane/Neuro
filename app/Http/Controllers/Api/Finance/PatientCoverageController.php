<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientCoverage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientCoverageController extends Controller
{
    public function index(Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        return response()->json([
            'data' => $patient->coverages()->with('payer')->orderByDesc('is_primary')->get(),
        ]);
    }

    public function store(Request $request, Patient $patient): JsonResponse
    {
        $this->authorize('update', $patient);
        $data = $request->validate([
            'payer_id' => 'required|exists:payers,id',
            'member_number' => 'nullable|string|max:100',
            'coverage_rate' => 'required|integer|min:0|max:100',
            'ceiling_amount' => 'nullable|integer|min:0',
            'starts_on' => 'nullable|date',
            'ends_on' => 'nullable|date|after_or_equal:starts_on',
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if (! empty($data['is_primary'])) {
            $patient->coverages()->update(['is_primary' => false]);
        }

        $coverage = $patient->coverages()->create($data);

        return response()->json(['data' => $coverage->load('payer')], 201);
    }

    public function update(Request $request, Patient $patient, PatientCoverage $coverage): JsonResponse
    {
        $this->authorize('update', $patient);
        abort_unless($coverage->patient_id === $patient->id, 404);

        $data = $request->validate([
            'payer_id' => 'sometimes|exists:payers,id',
            'member_number' => 'nullable|string|max:100',
            'coverage_rate' => 'sometimes|integer|min:0|max:100',
            'ceiling_amount' => 'nullable|integer|min:0',
            'starts_on' => 'nullable|date',
            'ends_on' => 'nullable|date',
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if (! empty($data['is_primary'])) {
            $patient->coverages()->where('id', '!=', $coverage->id)->update(['is_primary' => false]);
        }

        $coverage->update($data);

        return response()->json(['data' => $coverage->fresh('payer')]);
    }

    public function destroy(Patient $patient, PatientCoverage $coverage): JsonResponse
    {
        $this->authorize('update', $patient);
        abort_unless($coverage->patient_id === $patient->id, 404);
        $coverage->delete();

        return response()->json(null, 204);
    }
}
