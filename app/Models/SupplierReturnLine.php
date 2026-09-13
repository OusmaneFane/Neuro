<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierReturnLine extends Model
{
    protected $fillable = ['supplier_return_id', 'stock_lot_id', 'quantity'];

    protected function casts(): array
    {
        return ['quantity' => 'decimal:2'];
    }

    public function supplierReturn(): BelongsTo
    {
        return $this->belongsTo(SupplierReturn::class);
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'stock_lot_id');
    }
}
