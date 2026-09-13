<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'episode_id' => $this->episode_id,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient->id,
                'iup' => $this->patient->iup,
                'full_name' => $this->patient->full_name,
            ]),
            'type' => $this->type->value,
            'filename' => $this->filename,
            'path' => $this->path,
            'url' => $this->url,
            'mime' => $this->mime,
            'size' => $this->size,
            'is_viewable' => $this->isViewable(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'created_by' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'full_name' => $this->creator->full_name,
            ]),
        ];
    }
}
