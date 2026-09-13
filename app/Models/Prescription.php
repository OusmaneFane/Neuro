<?php

namespace App\Models;

use App\Enums\PrescriptionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    protected $fillable = [
        'patient_id', 'episode_id', 'status', 'notes', 'prescribed_by', 'prescribed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => PrescriptionStatus::class,
            'prescribed_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public function dispensations(): HasMany
    {
        return $this->hasMany(Dispensation::class);
    }

    public function prescriber(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prescribed_by');
    }
}
