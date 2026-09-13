<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientComplementaryData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientComplementaryDataController extends Controller
{
    public function show(Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        $data = PatientComplementaryData::firstOrCreate(
            ['patient_id' => $patient->id],
            [
                'imagerie' => [],
                'exploration' => [],
                'biologie' => [],
            ]
        );

        return response()->json([
            'id' => $data->id,
            'patient_id' => $data->patient_id,
            'imagerie' => $data->imagerie ?? [],
            'exploration' => $data->exploration ?? [],
            'biologie' => $data->biologie ?? [],
            'traitement_entree' => $data->traitement_entree ?? '',
            'traitement_sortie' => $data->traitement_sortie ?? '',
            'evolution' => $data->evolution ?? '',
            'evolution_justification' => $data->evolution_justification ?? '',
            'mode_sortie' => $data->mode_sortie ?? '',
            'compte_rendu' => $data->compte_rendu ?? '',
            'antecedents' => array_merge(
                self::emptyAntecedents(),
                is_array($data->antecedents) ? $data->antecedents : []
            ),
            'updated_at' => $data->updated_at?->toIso8601String(),
        ]);
    }

    public function update(Request $request, Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        $validated = $request->validate([
            'imagerie' => ['sometimes', 'array'],
            'exploration' => ['sometimes', 'array'],
            'biologie' => ['sometimes', 'array'],
            'traitement_entree' => ['sometimes', 'nullable', 'string'],
            'traitement_sortie' => ['sometimes', 'nullable', 'string'],
            'evolution' => ['sometimes', 'nullable', 'string', 'max:50'],
            'evolution_justification' => ['sometimes', 'nullable', 'string'],
            'mode_sortie' => ['sometimes', 'nullable', 'string', 'max:100'],
            'compte_rendu' => ['sometimes', 'nullable', 'string'],
            'antecedents' => ['sometimes', 'nullable', 'array'],
            'antecedents.medicaux' => ['sometimes', 'array'],
            'antecedents.medicaux.*' => ['string', 'max:500'],
            'antecedents.chirurgicaux' => ['sometimes', 'array'],
            'antecedents.chirurgicaux.*' => ['string', 'max:500'],
            'antecedents.gyneco' => ['sometimes', 'array'],
            'antecedents.gyneco.*' => ['string', 'max:500'],
            'antecedents.familiaux' => ['sometimes', 'array'],
            'antecedents.familiaux.*' => ['string', 'max:500'],
            'antecedents.traitements_anterieurs' => ['sometimes', 'array'],
            'antecedents.traitements_anterieurs.*' => ['string', 'max:500'],
            'antecedents.allergies' => ['sometimes', 'array'],
            'antecedents.allergies.*' => ['string', 'max:500'],
        ]);

        $data = PatientComplementaryData::firstOrCreate(
            ['patient_id' => $patient->id],
            [
                'imagerie' => [],
                'exploration' => [],
                'biologie' => [],
            ]
        );

        $data->update($validated);

        return response()->json([
            'id' => $data->id,
            'patient_id' => $data->patient_id,
            'imagerie' => $data->imagerie ?? [],
            'exploration' => $data->exploration ?? [],
            'biologie' => $data->biologie ?? [],
            'traitement_entree' => $data->traitement_entree ?? '',
            'traitement_sortie' => $data->traitement_sortie ?? '',
            'evolution' => $data->evolution ?? '',
            'evolution_justification' => $data->evolution_justification ?? '',
            'mode_sortie' => $data->mode_sortie ?? '',
            'compte_rendu' => $data->compte_rendu ?? '',
            'antecedents' => array_merge(
                self::emptyAntecedents(),
                is_array($data->antecedents) ? $data->antecedents : []
            ),
            'updated_at' => $data->updated_at?->toIso8601String(),
        ]);
    }

    /**
     * @return array{
     *     medicaux: array,
     *     chirurgicaux: array,
     *     gyneco: array,
     *     familiaux: array,
     *     traitements_anterieurs: array,
     *     allergies: array
     * }
     */
    private static function emptyAntecedents(): array
    {
        return [
            'medicaux' => [],
            'chirurgicaux' => [],
            'gyneco' => [],
            'familiaux' => [],
            'traitements_anterieurs' => [],
            'allergies' => [],
        ];
    }
}
