<?php

namespace App\Models;

use App\Enums\ClaimStatus;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ThirdPartyClaim extends Model
{
    use LogsActivity;

    protected $fillable = [
        'invoice_id', 'payer_id', 'claimed_amount', 'accepted_amount', 'settled_amount',
        'status', 'submitted_at', 'rejection_reason', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => ClaimStatus::class,
            'claimed_amount' => 'integer',
            'accepted_amount' => 'integer',
            'settled_amount' => 'integer',
            'submitted_at' => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(Payer::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(ThirdPartySettlement::class);
    }
}
