<?php

namespace App\Services\Pharmacy;

use App\Enums\InvoiceStatus;
use App\Enums\PrescriptionStatus;
use App\Enums\StockMovementType;
use App\Models\Dispensation;
use App\Models\DispensationItem;
use App\Models\Invoice;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Services\Finance\InvoiceService;
use Illuminate\Support\Facades\DB;

class DispensationService
{
    public function __construct(
        protected StockService $stock,
        protected InvoiceService $invoices
    ) {}

    public function dispense(Prescription $prescription, array $items, int $userId, bool $billToInvoice = true): Dispensation
    {
        if (in_array($prescription->status, [PrescriptionStatus::CANCELLED, PrescriptionStatus::DISPENSED], true)) {
            abort(422, 'Cette ordonnance ne peut plus être délivrée.');
        }

        return DB::transaction(function () use ($prescription, $items, $userId, $billToInvoice) {
            $dispensation = Dispensation::create([
                'prescription_id' => $prescription->id,
                'dispensed_at' => now(),
                'dispensed_by' => $userId,
                'bill_to_invoice' => $billToInvoice,
            ]);

            $invoiceLines = [];

            foreach ($items as $row) {
                /** @var PrescriptionItem $pItem */
                $pItem = PrescriptionItem::where('prescription_id', $prescription->id)
                    ->where('id', $row['prescription_item_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $qty = (float) $row['quantity'];
                if ($qty > $pItem->remainingQuantity() + 0.0001) {
                    abort(422, 'Quantité supérieure au reste à délivrer pour '.$pItem->product?->name);
                }

                $picks = isset($row['stock_lot_id'])
                    ? [['lot' => \App\Models\StockLot::lockForUpdate()->findOrFail($row['stock_lot_id']), 'quantity' => $qty]]
                    : $this->stock->pickFefo($pItem->product_id, $qty);

                $taken = 0;
                foreach ($picks as $pick) {
                    $this->stock->decreaseLot(
                        $pick['lot'],
                        $pick['quantity'],
                        StockMovementType::OUT_DISPENSE,
                        $dispensation,
                        $userId,
                        'Délivrance ordonnance #'.$prescription->id
                    );

                    DispensationItem::create([
                        'dispensation_id' => $dispensation->id,
                        'prescription_item_id' => $pItem->id,
                        'stock_lot_id' => $pick['lot']->id,
                        'quantity' => $pick['quantity'],
                        'unit_price' => $pItem->product->sale_price,
                    ]);
                    $taken += $pick['quantity'];
                }

                $pItem->quantity_dispensed = (float) $pItem->quantity_dispensed + $taken;
                $pItem->save();

                if ($billToInvoice) {
                    $invoiceLines[] = [
                        'product_id' => $pItem->product_id,
                        'label' => $pItem->product->name,
                        'quantity' => $taken,
                        'unit_price' => $pItem->product->sale_price,
                        'discount' => 0,
                        'cost_center_id' => $pItem->product->cost_center_id,
                    ];
                }
            }

            $allDispensed = $prescription->items()->get()->every(fn (PrescriptionItem $i) => $i->remainingQuantity() <= 0.0001);
            $anyDispensed = $prescription->items()->where('quantity_dispensed', '>', 0)->exists();
            $prescription->update([
                'status' => $allDispensed
                    ? PrescriptionStatus::DISPENSED
                    : ($anyDispensed ? PrescriptionStatus::PARTIALLY_DISPENSED : $prescription->status),
            ]);

            if ($billToInvoice && count($invoiceLines) > 0) {
                $invoice = $this->invoices->createDraft($prescription->patient, [
                    'episode_id' => $prescription->episode_id,
                    'notes' => 'Délivrance pharmacie — ordonnance #'.$prescription->id,
                    'lines' => $invoiceLines,
                ], $userId);
                $this->invoices->issue($invoice, $userId);
                $dispensation->update(['invoice_id' => $invoice->id]);
            }

            return $dispensation->fresh(['items.lot', 'items.prescriptionItem.product', 'invoice']);
        });
    }
}
