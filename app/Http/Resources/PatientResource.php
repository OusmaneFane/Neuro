<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'iup' => $this->iup,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'sex' => $this->sex,
            'laterality' => $this->laterality,
            'phone' => $this->phone,
            'address' => $this->address,
            'education_level' => $this->education_level,
            'profession' => $this->profession,
            'marital_status' => $this->marital_status,
            'treating_doctor' => $this->treating_doctor,
            'usual_treatment' => $this->usual_treatment,
            'emergency_contact' => $this->emergency_contact,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_first_name' => $this->emergency_contact_first_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'status' => $this->status,
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
            'evolution' => $this->whenLoaded('complementaryData', fn () => $this->complementaryData?->evolution),
            'mode_sortie' => $this->whenLoaded('complementaryData', fn () => $this->complementaryData?->mode_sortie),
        ];
    }
}
