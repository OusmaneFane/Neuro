<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionItem extends Model
{
    protected $fillable = [
        'prescription_id', 'product_id', 'quantity', 'quantity_dispensed',
        'dosage_instructions', 'duration_days',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'quantity_dispensed' => 'decimal:2',
            'duration_days' => 'integer',
        ];
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function remainingQuantity(): float
    {
        return max(0, (float) $this->quantity - (float) $this->quantity_dispensed);
    }
}
