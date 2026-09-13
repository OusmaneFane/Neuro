<?php

namespace App\Models;

use App\Enums\PayerType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payer extends Model
{
    protected $fillable = [
        'code', 'name', 'type', 'contact_name', 'phone', 'email',
        'address', 'default_coverage_rate', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => PayerType::class,
            'is_active' => 'boolean',
            'default_coverage_rate' => 'integer',
        ];
    }

    public function coverages(): HasMany
    {
        return $this->hasMany(PatientCoverage::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(ThirdPartyClaim::class);
    }
}
