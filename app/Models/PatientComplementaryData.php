<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientComplementaryData extends Model
{
    protected $table = 'patient_complementary_data';

    protected $fillable = [
        'patient_id',
        'imagerie',
        'exploration',
        'biologie',
        'traitement_entree',
        'traitement_sortie',
        'evolution',
        'evolution_justification',
        'mode_sortie',
        'compte_rendu',
        'antecedents',
    ];

    protected function casts(): array
    {
        return [
            'imagerie' => 'array',
            'exploration' => 'array',
            'biologie' => 'array',
            'antecedents' => 'array',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
