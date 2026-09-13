<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DispensationItem extends Model
{
    protected $fillable = [
        'dispensation_id', 'prescription_item_id', 'stock_lot_id', 'quantity', 'unit_price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'integer',
        ];
    }

    public function dispensation(): BelongsTo
    {
        return $this->belongsTo(Dispensation::class);
    }

    public function prescriptionItem(): BelongsTo
    {
        return $this->belongsTo(PrescriptionItem::class);
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'stock_lot_id');
    }
}
