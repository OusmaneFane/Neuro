<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShareTokenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'token' => $this->token,
            'scope' => $this->scope->value,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'share_url' => url("/share/{$this->token}"),
        ];
    }
}
