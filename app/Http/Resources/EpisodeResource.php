<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EpisodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient->id,
                'iup' => $this->patient->iup,
                'full_name' => $this->patient->full_name,
                'birth_date' => $this->patient->birth_date?->format('Y-m-d'),
            ]),
            'type' => $this->type->value,
            'transport_mean' => $this->transport_mean,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'reason' => $this->reason,
            'therapeutic_pathway' => $this->therapeutic_pathway,
            'provenance' => $this->provenance,
            'medical_history' => $this->medical_history,
            'dietary_habits' => $this->dietary_habits,
            'clinical_exam' => $this->clinical_exam,
            'diagnosis' => $this->diagnosis,
            'complications' => $this->complications,
            'discharge_date' => $this->discharge_date?->format('Y-m-d'),
            'discharge_reason' => $this->discharge_reason,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'created_by' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'full_name' => $this->creator->full_name,
            ]),
            'updated_by' => $this->whenLoaded('updater', fn () => [
                'id' => $this->updater->id,
                'full_name' => $this->updater->full_name,
            ]),
        ];
    }
}
