<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThirdPartySettlement extends Model
{
    protected $fillable = [
        'third_party_claim_id', 'amount', 'reference', 'settled_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'settled_at' => 'datetime',
        ];
    }

    public function claim(): BelongsTo
    {
        return $this->belongsTo(ThirdPartyClaim::class, 'third_party_claim_id');
    }
}
