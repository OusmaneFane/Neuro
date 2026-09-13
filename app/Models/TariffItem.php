<?php

namespace App\Models;

use App\Enums\TariffCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TariffItem extends Model
{
    protected $fillable = [
        'code', 'label', 'category', 'unit_price', 'cost_center_id', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'category' => TariffCategory::class,
            'unit_price' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }
}
