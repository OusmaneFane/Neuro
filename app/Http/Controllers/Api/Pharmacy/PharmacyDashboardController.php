<?php

namespace App\Http\Controllers\Api\Pharmacy;

use App\Enums\PurchaseOrderStatus;
use App\Http\Controllers\Controller;
use App\Models\DispensationItem;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockLot;
use App\Services\Pharmacy\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PharmacyDashboardController extends Controller
{
    public function __construct(protected StockService $stock) {}

    public function stats(): JsonResponse
    {
        $alerts = $this->stock->alerts();
        $valuation = (int) StockLot::selectRaw('coalesce(sum(qty_on_hand * unit_cost),0) as v')->value('v');

        $top = DispensationItem::query()
            ->join('prescription_items', 'dispensation_items.prescription_item_id', '=', 'prescription_items.id')
            ->join('products', 'prescription_items.product_id', '=', 'products.id')
            ->where('dispensation_items.created_at', '>=', now()->subDays(30))
            ->selectRaw('products.id, products.name, products.code, sum(dispensation_items.quantity) as qty')
            ->groupBy('products.id', 'products.name', 'products.code')
            ->orderByDesc('qty')
            ->limit(8)
            ->get();

        return response()->json([
            'products_active' => Product::where('is_active', true)->count(),
            'stock_valuation' => $valuation,
            'open_orders' => PurchaseOrder::whereIn('status', [
                PurchaseOrderStatus::SENT, PurchaseOrderStatus::PARTIALLY_RECEIVED, PurchaseOrderStatus::DRAFT,
            ])->count(),
            'low_stock_count' => count($alerts['low_stock']),
            'expiry_alerts_count' => count($alerts['expiry']),
            'alerts' => $alerts,
            'top_dispensed' => $top,
        ]);
    }
}
