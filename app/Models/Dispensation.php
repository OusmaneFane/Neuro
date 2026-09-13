<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dispensation extends Model
{
    protected $fillable = [
        'prescription_id', 'invoice_id', 'dispensed_at', 'dispensed_by', 'bill_to_invoice',
    ];

    protected function casts(): array
    {
        return [
            'dispensed_at' => 'datetime',
            'bill_to_invoice' => 'boolean',
        ];
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(DispensationItem::class);
    }

    public function dispenser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dispensed_by');
    }
}
