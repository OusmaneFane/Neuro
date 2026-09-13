<?php

namespace App\Http\Controllers\Api\Pharmacy;

use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\SupplierReturn;
use App\Models\SupplierReturnLine;
use App\Services\Pharmacy\StockService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(protected StockService $stock) {}

    public function index(Request $request): JsonResponse
    {
        $q = PurchaseOrder::with('supplier:id,code,name')->orderByDesc('created_at');
        if ($status = $request->input('status')) {
            $q->where('status', $status);
        }

        return response()->json($q->paginate(min((int) $request->input('limit', 20), 100)));
    }

    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        $purchaseOrder->load(['supplier', 'lines.product', 'receipts.lines']);

        return response()->json(['data' => $purchaseOrder]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'expected_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:products,id',
            'lines.*.quantity_ordered' => 'required|numeric|min:0.01',
            'lines.*.unit_cost' => 'required|integer|min:0',
        ]);

        $po = DB::transaction(function () use ($data) {
            $number = $this->nextNumber('BC');
            $po = PurchaseOrder::create([
                'number' => $number,
                'supplier_id' => $data['supplier_id'],
                'status' => PurchaseOrderStatus::DRAFT,
                'expected_at' => $data['expected_at'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);
            foreach ($data['lines'] as $line) {
                PurchaseOrderLine::create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $line['product_id'],
                    'quantity_ordered' => $line['quantity_ordered'],
                    'unit_cost' => $line['unit_cost'],
                ]);
            }

            return $po->load(['supplier', 'lines.product']);
        });

        return response()->json(['data' => $po], 201);
    }

    public function send(PurchaseOrder $purchaseOrder): JsonResponse
    {
        if ($purchaseOrder->status !== PurchaseOrderStatus::DRAFT) {
            abort(422, 'Seul un brouillon peut être envoyé.');
        }
        $purchaseOrder->update([
            'status' => PurchaseOrderStatus::SENT,
            'ordered_at' => now()->toDateString(),
        ]);

        return response()->json(['data' => $purchaseOrder->fresh()]);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        if (! in_array($purchaseOrder->status, [PurchaseOrderStatus::SENT, PurchaseOrderStatus::PARTIALLY_RECEIVED], true)) {
            abort(422, 'Réception impossible pour ce statut.');
        }

        $data = $request->validate([
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.purchase_order_line_id' => 'required|exists:purchase_order_lines,id',
            'lines.*.lot_number' => 'required|string|max:100',
            'lines.*.quantity' => 'required|numeric|min:0.01',
            'lines.*.expiry_date' => 'nullable|date',
            'lines.*.location' => 'nullable|string|max:100',
        ]);

        $receipt = DB::transaction(function () use ($purchaseOrder, $data) {
            $receipt = GoodsReceipt::create([
                'number' => $this->nextNumber('BR'),
                'purchase_order_id' => $purchaseOrder->id,
                'supplier_id' => $purchaseOrder->supplier_id,
                'received_at' => now(),
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($data['lines'] as $row) {
                $poLine = PurchaseOrderLine::where('purchase_order_id', $purchaseOrder->id)
                    ->where('id', $row['purchase_order_line_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                GoodsReceiptLine::create([
                    'goods_receipt_id' => $receipt->id,
                    'product_id' => $poLine->product_id,
                    'purchase_order_line_id' => $poLine->id,
                    'lot_number' => $row['lot_number'],
                    'expiry_date' => $row['expiry_date'] ?? null,
                    'quantity' => $row['quantity'],
                    'unit_cost' => $poLine->unit_cost,
                    'location' => $row['location'] ?? null,
                ]);

                $this->stock->increaseLot(
                    $poLine->product_id,
                    $row['lot_number'],
                    (float) $row['quantity'],
                    (int) $poLine->unit_cost,
                    $row['expiry_date'] ?? null,
                    $row['location'] ?? null,
                    StockMovementType::IN_PURCHASE,
                    $receipt,
                    (int) auth()->id(),
                    'Réception '.$receipt->number
                );

                $poLine->quantity_received = (float) $poLine->quantity_received + (float) $row['quantity'];
                $poLine->save();
            }

            $all = $purchaseOrder->lines()->get();
            $fully = $all->every(fn ($l) => (float) $l->quantity_received >= (float) $l->quantity_ordered);
            $purchaseOrder->update([
                'status' => $fully ? PurchaseOrderStatus::RECEIVED : PurchaseOrderStatus::PARTIALLY_RECEIVED,
            ]);

            return $receipt->load('lines.product');
        });

        return response()->json(['data' => $receipt], 201);
    }

    public function storeReturn(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'reason' => 'nullable|string|max:255',
            'lines' => 'required|array|min:1',
            'lines.*.stock_lot_id' => 'required|exists:stock_lots,id',
            'lines.*.quantity' => 'required|numeric|min:0.01',
        ]);

        $ret = DB::transaction(function () use ($data) {
            $ret = SupplierReturn::create([
                'number' => $this->nextNumber('RT'),
                'supplier_id' => $data['supplier_id'],
                'returned_at' => now(),
                'reason' => $data['reason'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($data['lines'] as $row) {
                $lot = \App\Models\StockLot::lockForUpdate()->findOrFail($row['stock_lot_id']);
                SupplierReturnLine::create([
                    'supplier_return_id' => $ret->id,
                    'stock_lot_id' => $lot->id,
                    'quantity' => $row['quantity'],
                ]);
                $this->stock->decreaseLot(
                    $lot,
                    (float) $row['quantity'],
                    StockMovementType::OUT_WASTE,
                    $ret,
                    (int) auth()->id(),
                    'Retour fournisseur '.$ret->number
                );
            }

            return $ret->load('lines.lot.product', 'supplier');
        });

        return response()->json(['data' => $ret], 201);
    }

    public function pdf(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load(['supplier', 'lines.product']);
        $pdf = Pdf::loadView('pdf.purchase-order', ['order' => $purchaseOrder]);

        return $pdf->download($purchaseOrder->number.'.pdf');
    }

    protected function nextNumber(string $prefix): string
    {
        $full = $prefix.'-'.now()->format('Ym');
        $model = match ($prefix) {
            'BC' => PurchaseOrder::class,
            'BR' => GoodsReceipt::class,
            'RT' => SupplierReturn::class,
            default => PurchaseOrder::class,
        };
        $last = $model::where('number', 'like', $full.'%')->orderByDesc('number')->value('number');
        $seq = $last ? ((int) Str::afterLast($last, '-')) + 1 : 1;

        return sprintf('%s-%04d', $full, $seq);
    }
}
