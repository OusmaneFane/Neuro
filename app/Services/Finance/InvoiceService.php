<?php

namespace App\Services\Finance;

use App\Enums\ClaimStatus;
use App\Enums\InvoiceStatus;
use App\Models\AccountingJournalEntry;
use App\Models\AnalyticalAllocation;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Patient;
use App\Models\PatientCoverage;
use App\Models\ThirdPartyClaim;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceService
{
    public function generateNumber(): string
    {
        $prefix = 'FAC-'.now()->format('Ym');
        $last = Invoice::where('number', 'like', $prefix.'%')->orderByDesc('number')->value('number');
        $seq = $last ? ((int) Str::afterLast($last, '-')) + 1 : 1;

        return sprintf('%s-%04d', $prefix, $seq);
    }

    public function createDraft(Patient $patient, array $data, int $userId): Invoice
    {
        return DB::transaction(function () use ($patient, $data, $userId) {
            $invoice = Invoice::create([
                'number' => $this->generateNumber(),
                'patient_id' => $patient->id,
                'episode_id' => $data['episode_id'] ?? null,
                'status' => InvoiceStatus::DRAFT,
                'currency_code' => 'XOF',
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $this->syncLines($invoice, $data['lines'] ?? []);
            $this->recalculate($invoice);

            return $invoice->fresh(['lines.costCenter', 'patient', 'episode']);
        });
    }

    public function updateDraft(Invoice $invoice, array $data, int $userId): Invoice
    {
        if ($invoice->status !== InvoiceStatus::DRAFT) {
            abort(422, 'Seules les factures brouillon peuvent être modifiées.');
        }

        return DB::transaction(function () use ($invoice, $data, $userId) {
            $invoice->update([
                'episode_id' => $data['episode_id'] ?? $invoice->episode_id,
                'notes' => $data['notes'] ?? $invoice->notes,
                'updated_by' => $userId,
            ]);

            if (array_key_exists('lines', $data)) {
                $invoice->lines()->delete();
                $this->syncLines($invoice, $data['lines']);
            }

            $this->recalculate($invoice);

            return $invoice->fresh(['lines.costCenter', 'patient', 'episode']);
        });
    }

    public function syncLines(Invoice $invoice, array $lines): void
    {
        foreach (array_values($lines) as $i => $line) {
            $qty = (float) ($line['quantity'] ?? 1);
            $unitPrice = (int) ($line['unit_price'] ?? 0);
            $discount = (int) ($line['discount'] ?? 0);
            $lineTotal = max(0, (int) round($qty * $unitPrice) - $discount);

            InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'tariff_item_id' => $line['tariff_item_id'] ?? null,
                'product_id' => $line['product_id'] ?? null,
                'label' => $line['label'],
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'discount' => $discount,
                'line_total' => $lineTotal,
                'cost_center_id' => $line['cost_center_id'] ?? null,
                'sort_order' => $i,
            ]);
        }
    }

    public function recalculate(Invoice $invoice): void
    {
        $invoice->load('lines', 'patient.coverages');
        $subtotal = (int) $invoice->lines->sum('line_total');
        $discount = (int) $invoice->lines->sum('discount');
        $total = $subtotal;

        $coverage = $this->resolvePrimaryCoverage($invoice->patient);
        $rate = $coverage?->coverage_rate ?? 0;
        $thirdParty = (int) round($total * $rate / 100);
        if ($coverage?->ceiling_amount !== null) {
            $thirdParty = min($thirdParty, (int) $coverage->ceiling_amount);
        }
        $patientShare = max(0, $total - $thirdParty);
        $paid = (int) $invoice->payments()->sum('amount');
        $balance = max(0, $patientShare - $paid);

        $invoice->update([
            'subtotal' => $subtotal + $discount,
            'discount_total' => $discount,
            'total' => $total,
            'patient_share' => $patientShare,
            'third_party_share' => $thirdParty,
            'amount_paid' => $paid,
            'balance_due' => $balance,
        ]);
    }

    public function resolvePrimaryCoverage(Patient $patient): ?PatientCoverage
    {
        return $patient->coverages()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('ends_on')->orWhere('ends_on', '>=', now()->toDateString());
            })
            ->orderByDesc('is_primary')
            ->first();
    }

    public function issue(Invoice $invoice, int $userId): Invoice
    {
        if ($invoice->status !== InvoiceStatus::DRAFT) {
            abort(422, 'Seules les factures brouillon peuvent être émises.');
        }
        if ($invoice->lines()->count() === 0) {
            abort(422, 'La facture doit contenir au moins une ligne.');
        }

        return DB::transaction(function () use ($invoice, $userId) {
            $this->recalculate($invoice);
            $invoice->update([
                'status' => InvoiceStatus::ISSUED,
                'issued_at' => now(),
                'updated_by' => $userId,
            ]);

            foreach ($invoice->lines as $line) {
                if ($line->cost_center_id) {
                    AnalyticalAllocation::updateOrCreate(
                        ['invoice_line_id' => $line->id, 'cost_center_id' => $line->cost_center_id],
                        ['amount' => $line->line_total, 'axis' => 'REVENUE']
                    );
                }

                AccountingJournalEntry::create([
                    'entry_date' => now()->toDateString(),
                    'label' => 'Émission '.$invoice->number.' — '.$line->label,
                    'debit' => $line->line_total,
                    'credit' => 0,
                    'cost_center_id' => $line->cost_center_id,
                    'source_type' => Invoice::class,
                    'source_id' => $invoice->id,
                    'created_by' => $userId,
                ]);
            }

            if ($invoice->third_party_share > 0) {
                $coverage = $this->resolvePrimaryCoverage($invoice->patient()->first());
                if ($coverage) {
                    ThirdPartyClaim::create([
                        'invoice_id' => $invoice->id,
                        'payer_id' => $coverage->payer_id,
                        'claimed_amount' => $invoice->third_party_share,
                        'accepted_amount' => $invoice->third_party_share,
                        'settled_amount' => 0,
                        'status' => ClaimStatus::DRAFT,
                        'created_by' => $userId,
                    ]);
                }
            }

            return $invoice->fresh(['lines', 'claims', 'patient', 'episode']);
        });
    }

    public function cancel(Invoice $invoice, int $userId): Invoice
    {
        if (! in_array($invoice->status, [InvoiceStatus::DRAFT, InvoiceStatus::ISSUED, InvoiceStatus::PARTIALLY_PAID], true)) {
            abort(422, 'Cette facture ne peut pas être annulée.');
        }

        $invoice->update([
            'status' => InvoiceStatus::CANCELLED,
            'updated_by' => $userId,
        ]);

        return $invoice->fresh();
    }

    public function refreshPaymentStatus(Invoice $invoice): void
    {
        $this->recalculate($invoice);
        $invoice->refresh();

        if (in_array($invoice->status, [InvoiceStatus::CANCELLED, InvoiceStatus::CREDITED, InvoiceStatus::DRAFT], true)) {
            return;
        }

        if ($invoice->balance_due <= 0 && $invoice->patient_share > 0) {
            $invoice->update(['status' => InvoiceStatus::PAID]);
        } elseif ($invoice->amount_paid > 0) {
            $invoice->update(['status' => InvoiceStatus::PARTIALLY_PAID]);
        } else {
            $invoice->update(['status' => InvoiceStatus::ISSUED]);
        }
    }
}
