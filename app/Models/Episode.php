<?php

namespace App\Models;

use App\Enums\EpisodeType;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Episode extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'patient_id',
        'created_by',
        'updated_by',
        'type',
        'transport_mean',
        'start_date',
        'end_date',
        'reason',
        'therapeutic_pathway',
        'provenance',
        'medical_history',
        'dietary_habits',
        'clinical_exam',
        'diagnosis',
        'complications',
        'discharge_date',
        'discharge_reason',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'type' => EpisodeType::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'discharge_date' => 'date',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
