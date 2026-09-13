<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use LogsActivity;

    protected $fillable = [
        'number', 'patient_id', 'episode_id', 'status', 'currency_code',
        'subtotal', 'discount_total', 'total', 'patient_share', 'third_party_share',
        'amount_paid', 'balance_due', 'issued_at', 'notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'issued_at' => 'datetime',
            'subtotal' => 'integer',
            'discount_total' => 'integer',
            'total' => 'integer',
            'patient_share' => 'integer',
            'third_party_share' => 'integer',
            'amount_paid' => 'integer',
            'balance_due' => 'integer',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class)->orderBy('sort_order');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(ThirdPartyClaim::class);
    }

    public function creditNotes(): HasMany
    {
        return $this->hasMany(CreditNote::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
