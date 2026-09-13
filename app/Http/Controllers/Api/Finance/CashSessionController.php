<?php

namespace App\Http\Controllers\Api\Finance;

use App\Enums\CashSessionStatus;
use App\Enums\PaymentMode;
use App\Http\Controllers\Controller;
use App\Models\CashSession;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Finance\InvoiceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CashSessionController extends Controller
{
    public function __construct(protected InvoiceService $invoices) {}

    public function index(Request $request): JsonResponse
    {
        $sessions = CashSession::with(['opener:id,full_name', 'closer:id,full_name'])
            ->orderByDesc('opened_at')
            ->paginate(min((int) $request->input('limit', 20), 100));

        return response()->json($sessions);
    }

    public function current(): JsonResponse
    {
        $session = CashSession::with(['opener:id,full_name', 'payments.invoice:id,number,patient_id'])
            ->where('status', CashSessionStatus::OPEN)
            ->latest('opened_at')
            ->first();

        return response()->json(['data' => $session]);
    }

    public function open(Request $request): JsonResponse
    {
        if (CashSession::where('status', CashSessionStatus::OPEN)->exists()) {
            abort(422, 'Une session de caisse est déjà ouverte.');
        }

        $data = $request->validate([
            'opening_float' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $session = CashSession::create([
            'opened_by' => auth()->id(),
            'status' => CashSessionStatus::OPEN,
            'opening_float' => $data['opening_float'] ?? 0,
            'opened_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => $session->load('opener:id,full_name')], 201);
    }

    public function close(Request $request, CashSession $cashSession): JsonResponse
    {
        if ($cashSession->status !== CashSessionStatus::OPEN) {
            abort(422, 'Session déjà clôturée.');
        }

        $data = $request->validate([
            'closing_amount' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $cashPayments = (int) $cashSession->payments()->where('mode', PaymentMode::CASH)->sum('amount');
        $expected = (int) $cashSession->opening_float + $cashPayments;

        $cashSession->update([
            'status' => CashSessionStatus::CLOSED,
            'closed_by' => auth()->id(),
            'closed_at' => now(),
            'expected_cash' => $expected,
            'closing_amount' => $data['closing_amount'],
            'variance' => ((int) $data['closing_amount']) - $expected,
            'notes' => $data['notes'] ?? $cashSession->notes,
        ]);

        return response()->json(['data' => $cashSession->fresh(['opener', 'closer'])]);
    }

    public function storePayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|integer|min:1',
            'mode' => 'required|in:CASH,MOBILE_MONEY,CARD,BANK_TRANSFER,CHEQUE',
            'reference' => 'nullable|string|max:100',
            'cash_session_id' => 'nullable|exists:cash_sessions,id',
        ]);

        $payment = DB::transaction(function () use ($data) {
            $invoice = Invoice::lockForUpdate()->findOrFail($data['invoice_id']);
            $this->invoices->recalculate($invoice);
            $invoice->refresh();

            if ($data['amount'] > $invoice->balance_due) {
                abort(422, 'Montant supérieur au solde patient ('.$invoice->balance_due.' F CFA).');
            }

            $sessionId = $data['cash_session_id'] ?? null;
            if (! $sessionId && in_array($data['mode'], ['CASH', 'MOBILE_MONEY', 'CARD'], true)) {
                $open = CashSession::where('status', CashSessionStatus::OPEN)->first();
                $sessionId = $open?->id;
            }

            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'cash_session_id' => $sessionId,
                'amount' => $data['amount'],
                'mode' => $data['mode'],
                'reference' => $data['reference'] ?? null,
                'paid_at' => now(),
                'created_by' => auth()->id(),
            ]);

            $this->invoices->refreshPaymentStatus($invoice);

            return $payment->load('invoice', 'cashSession');
        });

        return response()->json(['data' => $payment], 201);
    }

    public function receiptPdf(Payment $payment): Response
    {
        $payment->load(['invoice.patient', 'creator:id,full_name']);
        $pdf = Pdf::loadView('pdf.payment-receipt', ['payment' => $payment]);

        return $pdf->download('recu-'.$payment->id.'.pdf');
    }
}
