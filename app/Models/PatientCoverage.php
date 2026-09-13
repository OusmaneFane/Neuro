<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientCoverage extends Model
{
    protected $fillable = [
        'patient_id', 'payer_id', 'member_number', 'coverage_rate',
        'ceiling_amount', 'starts_on', 'ends_on', 'is_primary', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'is_primary' => 'boolean',
            'is_active' => 'boolean',
            'coverage_rate' => 'integer',
            'ceiling_amount' => 'integer',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(Payer::class);
    }
}
