<?php

namespace App\Http\Controllers\Api;

use App\Enums\InvoiceStatus;
use App\Enums\PurchaseOrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Episode;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Services\Pharmacy\StockService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(protected StockService $stock) {}

    public function stats(): JsonResponse
    {
        $role = auth()->user()?->role;

        $patientsCount = Patient::count();
        $episodesCount = Episode::count();
        $documentsCount = Document::count();

        $episodesByType = Episode::selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->map(fn ($v) => (int) $v)
            ->all();

        $documentsByType = Document::selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->map(fn ($v) => (int) $v)
            ->all();

        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months->push($date->format('Y-m'));
        }

        $patientsByMonth = Patient::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, count(*) as count")
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->pluck('count', 'month')
            ->all();

        $episodesByMonth = Episode::selectRaw("DATE_FORMAT(start_date, '%Y-%m') as month, count(*) as count")
            ->where('start_date', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->pluck('count', 'month')
            ->all();

        $patientsTrend = $months->map(fn ($m) => $patientsByMonth[$m] ?? 0)->values()->all();
        $episodesTrend = $months->map(fn ($m) => $episodesByMonth[$m] ?? 0)->values()->all();

        return response()->json([
            'patients_count' => $patientsCount,
            'episodes_count' => $episodesCount,
            'documents_count' => $documentsCount,
            'episodes_by_type' => [
                'CONSULTATION' => $episodesByType['CONSULTATION'] ?? 0,
                'HOSPITALIZATION' => $episodesByType['HOSPITALIZATION'] ?? 0,
                'EMERGENCY' => $episodesByType['EMERGENCY'] ?? 0,
            ],
            'documents_by_type' => [
                'LAB' => $documentsByType['LAB'] ?? 0,
                'IMAGING' => $documentsByType['IMAGING'] ?? 0,
                'PRESCRIPTION' => $documentsByType['PRESCRIPTION'] ?? 0,
                'DISCHARGE' => $documentsByType['DISCHARGE'] ?? 0,
                'ADMIN' => $documentsByType['ADMIN'] ?? 0,
                'OTHER' => $documentsByType['OTHER'] ?? 0,
            ],
            'trend_labels' => $months->map(fn ($m) => \Carbon\Carbon::parse($m.'-01')->locale('fr')->isoFormat('MMM YYYY'))->values()->all(),
            'patients_trend' => $patientsTrend,
            'episodes_trend' => $episodesTrend,
            'finance' => $role?->canAccessFinance() ? $this->financeSummary() : null,
            'pharmacy' => $role?->canAccessPharmacy() ? $this->pharmacySummary() : null,
            'show_clinical' => $role?->canAccessClinical() ?? false,
        ]);
    }

    private function financeSummary(): array
    {
        $today = now()->toDateString();
        $issued = [InvoiceStatus::ISSUED, InvoiceStatus::PARTIALLY_PAID, InvoiceStatus::PAID, InvoiceStatus::CREDITED];

        return [
            'revenue_today' => (int) Invoice::whereIn('status', $issued)->whereDate('issued_at', $today)->sum('total'),
            'payments_today' => (int) Payment::whereDate('paid_at', $today)->sum('amount'),
            'open_invoices' => Invoice::whereIn('status', [InvoiceStatus::ISSUED, InvoiceStatus::PARTIALLY_PAID])->count(),
            'balance_due' => (int) Invoice::whereIn('status', [InvoiceStatus::ISSUED, InvoiceStatus::PARTIALLY_PAID])->sum('balance_due'),
        ];
    }

    private function pharmacySummary(): array
    {
        $alerts = $this->stock->alerts();

        return [
            'products_active' => Product::where('is_active', true)->count(),
            'low_stock_count' => count($alerts['low_stock']),
            'expiry_alerts_count' => count($alerts['expiry']),
            'open_orders' => PurchaseOrder::whereIn('status', [
                PurchaseOrderStatus::SENT,
                PurchaseOrderStatus::PARTIALLY_RECEIVED,
                PurchaseOrderStatus::DRAFT,
            ])->count(),
        ];
    }
}
