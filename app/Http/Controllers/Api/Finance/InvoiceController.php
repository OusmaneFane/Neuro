<?php

namespace App\Http\Controllers\Api\Finance;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Models\CreditNote;
use App\Models\CreditNoteLine;
use App\Models\Invoice;
use App\Models\Patient;
use App\Services\Finance\InvoiceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    public function __construct(protected InvoiceService $service) {}

    public function index(Request $request): JsonResponse
    {
        $q = Invoice::query()->with(['patient:id,iup,first_name,last_name', 'episode:id,type,start_date']);

        if ($status = $request->input('status')) {
            $q->where('status', $status);
        }
        if ($patientId = $request->input('patient_id')) {
            $q->where('patient_id', $patientId);
        }
        if ($search = $request->input('query')) {
            $term = '%'.$search.'%';
            $q->where(function ($b) use ($term) {
                $b->where('number', 'like', $term)
                    ->orWhereHas('patient', fn ($p) => $p->where('first_name', 'like', $term)
                        ->orWhere('last_name', 'like', $term)
                        ->orWhere('iup', 'like', $term));
            });
        }

        $invoices = $q->orderByDesc('created_at')->paginate(min((int) $request->input('limit', 20), 100));

        return response()->json($invoices);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load([
            'lines.costCenter', 'lines.tariffItem', 'lines.product',
            'patient', 'episode', 'payments', 'claims.payer', 'creditNotes.lines', 'creator:id,full_name',
        ]);

        return response()->json(['data' => $invoice]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'episode_id' => 'nullable|exists:episodes,id',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.label' => 'required|string|max:255',
            'lines.*.quantity' => 'required|numeric|min:0.01',
            'lines.*.unit_price' => 'required|integer|min:0',
            'lines.*.discount' => 'nullable|integer|min:0',
            'lines.*.tariff_item_id' => 'nullable|exists:tariff_items,id',
            'lines.*.product_id' => 'nullable|exists:products,id',
            'lines.*.cost_center_id' => 'nullable|exists:cost_centers,id',
        ]);

        $patient = Patient::findOrFail($data['patient_id']);
        $invoice = $this->service->createDraft($patient, $data, (int) auth()->id());

        return response()->json(['data' => $invoice], 201);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'episode_id' => 'nullable|exists:episodes,id',
            'notes' => 'nullable|string',
            'lines' => 'sometimes|array|min:1',
            'lines.*.label' => 'required_with:lines|string|max:255',
            'lines.*.quantity' => 'required_with:lines|numeric|min:0.01',
            'lines.*.unit_price' => 'required_with:lines|integer|min:0',
            'lines.*.discount' => 'nullable|integer|min:0',
            'lines.*.tariff_item_id' => 'nullable|exists:tariff_items,id',
            'lines.*.product_id' => 'nullable|exists:products,id',
            'lines.*.cost_center_id' => 'nullable|exists:cost_centers,id',
        ]);

        $invoice = $this->service->updateDraft($invoice, $data, (int) auth()->id());

        return response()->json(['data' => $invoice]);
    }

    public function issue(Invoice $invoice): JsonResponse
    {
        return response()->json(['data' => $this->service->issue($invoice, (int) auth()->id())]);
    }

    public function cancel(Invoice $invoice): JsonResponse
    {
        return response()->json(['data' => $this->service->cancel($invoice, (int) auth()->id())]);
    }

    public function creditNote(Request $request, Invoice $invoice): JsonResponse
    {
        if (! in_array($invoice->status, [InvoiceStatus::ISSUED, InvoiceStatus::PARTIALLY_PAID, InvoiceStatus::PAID], true)) {
            abort(422, 'Avoir impossible pour ce statut.');
        }

        $data = $request->validate([
            'reason' => 'nullable|string|max:255',
            'lines' => 'nullable|array',
            'lines.*.invoice_line_id' => 'nullable|exists:invoice_lines,id',
            'lines.*.label' => 'required_with:lines|string',
            'lines.*.quantity' => 'required_with:lines|numeric|min:0.01',
            'lines.*.unit_price' => 'required_with:lines|integer|min:0',
        ]);

        $credit = DB::transaction(function () use ($invoice, $data) {
            $prefix = 'AV-'.now()->format('Ym');
            $last = CreditNote::where('number', 'like', $prefix.'%')->orderByDesc('number')->value('number');
            $seq = $last ? ((int) Str::afterLast($last, '-')) + 1 : 1;
            $number = sprintf('%s-%04d', $prefix, $seq);

            $lines = $data['lines'] ?? $invoice->lines->map(fn ($l) => [
                'invoice_line_id' => $l->id,
                'label' => $l->label,
                'quantity' => $l->quantity,
                'unit_price' => $l->unit_price,
            ])->all();

            $total = 0;
            $credit = CreditNote::create([
                'number' => $number,
                'invoice_id' => $invoice->id,
                'total' => 0,
                'reason' => $data['reason'] ?? null,
                'issued_at' => now(),
                'created_by' => auth()->id(),
            ]);

            foreach ($lines as $line) {
                $lineTotal = (int) round(((float) $line['quantity']) * ((int) $line['unit_price']));
                $total += $lineTotal;
                CreditNoteLine::create([
                    'credit_note_id' => $credit->id,
                    'invoice_line_id' => $line['invoice_line_id'] ?? null,
                    'label' => $line['label'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'line_total' => $lineTotal,
                ]);
            }

            $credit->update(['total' => $total]);
            $invoice->update(['status' => InvoiceStatus::CREDITED, 'updated_by' => auth()->id()]);

            return $credit->load('lines');
        });

        return response()->json(['data' => $credit], 201);
    }

    public function pdf(Invoice $invoice): Response
    {
        $invoice->load(['lines', 'patient', 'episode', 'payments', 'claims.payer']);
        $pdf = Pdf::loadView('pdf.invoice', ['invoice' => $invoice]);

        return $pdf->download($invoice->number.'.pdf');
    }
}
