<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierReturn extends Model
{
    protected $fillable = [
        'number', 'supplier_id', 'returned_at', 'reason', 'created_by',
    ];

    protected function casts(): array
    {
        return ['returned_at' => 'datetime'];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SupplierReturnLine::class);
    }
}
