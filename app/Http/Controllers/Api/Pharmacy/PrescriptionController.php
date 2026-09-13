<?php

namespace App\Http\Controllers\Api\Pharmacy;

use App\Enums\PrescriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Services\Pharmacy\DispensationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class PrescriptionController extends Controller
{
    public function __construct(protected DispensationService $dispensation) {}

    public function index(Request $request): JsonResponse
    {
        $q = Prescription::with(['patient:id,iup,first_name,last_name', 'prescriber:id,full_name', 'items.product:id,code,name'])
            ->orderByDesc('created_at');

        if ($status = $request->input('status')) {
            $q->where('status', $status);
        }
        if ($patientId = $request->input('patient_id')) {
            $q->where('patient_id', $patientId);
        }

        return response()->json($q->paginate(min((int) $request->input('limit', 20), 100)));
    }

    public function forPatient(Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        return response()->json([
            'data' => $patient->prescriptions()
                ->with(['items.product', 'prescriber:id,full_name', 'dispensations'])
                ->get(),
        ]);
    }

    public function store(Request $request, Patient $patient): JsonResponse
    {
        $this->authorize('update', $patient);
        $data = $request->validate([
            'episode_id' => 'nullable|exists:episodes,id',
            'notes' => 'nullable|string',
            'activate' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.dosage_instructions' => 'nullable|string|max:255',
            'items.*.duration_days' => 'nullable|integer|min:1',
        ]);

        $rx = DB::transaction(function () use ($patient, $data) {
            $activate = $data['activate'] ?? true;
            $rx = Prescription::create([
                'patient_id' => $patient->id,
                'episode_id' => $data['episode_id'] ?? null,
                'status' => $activate ? PrescriptionStatus::ACTIVE : PrescriptionStatus::DRAFT,
                'notes' => $data['notes'] ?? null,
                'prescribed_by' => auth()->id(),
                'prescribed_at' => $activate ? now() : null,
            ]);
            foreach ($data['items'] as $item) {
                PrescriptionItem::create([
                    'prescription_id' => $rx->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'dosage_instructions' => $item['dosage_instructions'] ?? null,
                    'duration_days' => $item['duration_days'] ?? null,
                ]);
            }

            return $rx->load(['items.product', 'prescriber:id,full_name']);
        });

        return response()->json(['data' => $rx], 201);
    }

    public function show(Prescription $prescription): JsonResponse
    {
        $prescription->load([
            'patient', 'episode', 'items.product.lots' => fn ($q) => $q->where('qty_on_hand', '>', 0)->orderBy('expiry_date'),
            'prescriber:id,full_name', 'dispensations.items.lot',
        ]);

        return response()->json(['data' => $prescription]);
    }

    public function dispense(Request $request, Prescription $prescription): JsonResponse
    {
        $data = $request->validate([
            'bill_to_invoice' => 'boolean',
            'items' => 'required|array|min:1',
            'items.*.prescription_item_id' => 'required|exists:prescription_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.stock_lot_id' => 'nullable|exists:stock_lots,id',
        ]);

        $disp = $this->dispensation->dispense(
            $prescription,
            $data['items'],
            (int) auth()->id(),
            $data['bill_to_invoice'] ?? true
        );

        return response()->json(['data' => $disp], 201);
    }

    public function pdf(Prescription $prescription): Response
    {
        $prescription->load(['patient', 'items.product', 'prescriber', 'dispensations.items']);
        $pdf = Pdf::loadView('pdf.dispensation', ['prescription' => $prescription]);

        return $pdf->download('ordonnance-'.$prescription->id.'.pdf');
    }
}
