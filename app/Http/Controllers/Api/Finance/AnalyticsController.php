<?php

namespace App\Http\Controllers\Api\Finance;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Models\AccountingJournalEntry;
use App\Models\AnalyticalAllocation;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth();

        $issued = [InvoiceStatus::ISSUED, InvoiceStatus::PARTIALLY_PAID, InvoiceStatus::PAID, InvoiceStatus::CREDITED];

        return response()->json([
            'revenue_today' => (int) Invoice::whereIn('status', $issued)->whereDate('issued_at', $today)->sum('total'),
            'revenue_month' => (int) Invoice::whereIn('status', $issued)->where('issued_at', '>=', $monthStart)->sum('total'),
            'payments_today' => (int) Payment::whereDate('paid_at', $today)->sum('amount'),
            'payments_month' => (int) Payment::where('paid_at', '>=', $monthStart)->sum('amount'),
            'open_invoices' => Invoice::whereIn('status', [InvoiceStatus::ISSUED, InvoiceStatus::PARTIALLY_PAID])->count(),
            'balance_due' => (int) Invoice::whereIn('status', [InvoiceStatus::ISSUED, InvoiceStatus::PARTIALLY_PAID])->sum('balance_due'),
            'third_party_outstanding' => (int) DB::table('third_party_claims')
                ->whereNotIn('status', ['REJECTED', 'DRAFT', 'SETTLED'])
                ->selectRaw('coalesce(sum(accepted_amount - settled_amount),0) as t')
                ->value('t'),
            'revenue_by_month' => Invoice::query()
                ->whereIn('status', $issued)
                ->where('issued_at', '>=', now()->subMonths(5)->startOfMonth())
                ->get(['issued_at', 'total'])
                ->groupBy(fn ($inv) => optional($inv->issued_at)->format('Y-m') ?? 'n/a')
                ->map(fn ($group) => (int) $group->sum('total')),
            'payments_by_mode' => Payment::query()
                ->where('paid_at', '>=', $monthStart)
                ->selectRaw('mode, sum(amount) as total')
                ->groupBy('mode')
                ->pluck('total', 'mode'),
        ]);
    }

    public function byCostCenter(Request $request): JsonResponse
    {
        $from = $request->input('from', now()->startOfMonth()->toDateString());
        $to = $request->input('to', now()->toDateString());

        $rows = AnalyticalAllocation::query()
            ->join('invoice_lines', 'analytical_allocations.invoice_line_id', '=', 'invoice_lines.id')
            ->join('invoices', 'invoice_lines.invoice_id', '=', 'invoices.id')
            ->join('cost_centers', 'analytical_allocations.cost_center_id', '=', 'cost_centers.id')
            ->whereIn('invoices.status', ['ISSUED', 'PARTIALLY_PAID', 'PAID', 'CREDITED'])
            ->whereDate('invoices.issued_at', '>=', $from)
            ->whereDate('invoices.issued_at', '<=', $to)
            ->selectRaw('cost_centers.id, cost_centers.code, cost_centers.name, sum(analytical_allocations.amount) as total')
            ->groupBy('cost_centers.id', 'cost_centers.code', 'cost_centers.name')
            ->orderByDesc('total')
            ->get();

        return response()->json(['data' => $rows, 'from' => $from, 'to' => $to]);
    }

    public function journal(Request $request): JsonResponse
    {
        $q = AccountingJournalEntry::with('costCenter:id,code,name')->orderByDesc('entry_date')->orderByDesc('id');
        if ($from = $request->input('from')) {
            $q->whereDate('entry_date', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $q->whereDate('entry_date', '<=', $to);
        }

        return response()->json($q->paginate(min((int) $request->input('limit', 50), 200)));
    }

    public function exportCostCenterCsv(Request $request): StreamedResponse
    {
        $from = $request->input('from', now()->startOfMonth()->toDateString());
        $to = $request->input('to', now()->toDateString());
        $response = $this->byCostCenter($request);
        $rows = $response->getData(true)['data'] ?? [];

        return response()->streamDownload(function () use ($rows, $from, $to) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Période', $from, $to]);
            fputcsv($out, ['Code', 'Centre de coût', 'Montant (F CFA)']);
            foreach ($rows as $row) {
                fputcsv($out, [$row['code'], $row['name'], $row['total']]);
            }
            fclose($out);
        }, "analytique-{$from}-{$to}.csv", ['Content-Type' => 'text/csv']);
    }
}
