<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditNote extends Model
{
    protected $fillable = [
        'number', 'invoice_id', 'total', 'reason', 'issued_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'integer',
            'issued_at' => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CreditNoteLine::class);
    }
}
