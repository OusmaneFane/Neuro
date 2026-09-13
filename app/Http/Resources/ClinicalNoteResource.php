<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClinicalNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'content' => $this->content,
            'created_by' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'full_name' => $this->creator->full_name,
            ]),
            'updated_by' => $this->whenLoaded('updater', fn () => [
                'id' => $this->updater->id,
                'full_name' => $this->updater->full_name,
            ]),
            'deleted_by' => $this->whenLoaded('deleter', fn () => [
                'id' => $this->deleter->id,
                'full_name' => $this->deleter->full_name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
