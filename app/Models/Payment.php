<?php

namespace App\Models;

use App\Enums\PaymentMode;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use LogsActivity;

    protected $fillable = [
        'invoice_id', 'cash_session_id', 'amount', 'mode', 'reference', 'paid_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'mode' => PaymentMode::class,
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
