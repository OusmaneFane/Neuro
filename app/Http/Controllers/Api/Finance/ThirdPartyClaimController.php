<?php

namespace App\Http\Controllers\Api\Finance;

use App\Enums\ClaimStatus;
use App\Http\Controllers\Controller;
use App\Models\ThirdPartyClaim;
use App\Models\ThirdPartySettlement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ThirdPartyClaimController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ThirdPartyClaim::with(['invoice:id,number,patient_id,total', 'invoice.patient:id,first_name,last_name,iup', 'payer']);

        if ($status = $request->input('status')) {
            $q->where('status', $status);
        }
        if ($payerId = $request->input('payer_id')) {
            $q->where('payer_id', $payerId);
        }

        return response()->json($q->orderByDesc('created_at')->paginate(min((int) $request->input('limit', 20), 100)));
    }

    public function show(ThirdPartyClaim $thirdPartyClaim): JsonResponse
    {
        $thirdPartyClaim->load(['invoice.patient', 'invoice.lines', 'payer', 'settlements']);

        return response()->json(['data' => $thirdPartyClaim]);
    }

    public function submit(ThirdPartyClaim $thirdPartyClaim): JsonResponse
    {
        if ($thirdPartyClaim->status !== ClaimStatus::DRAFT) {
            abort(422, 'Seules les créances brouillon peuvent être soumises.');
        }
        $thirdPartyClaim->update([
            'status' => ClaimStatus::SUBMITTED,
            'submitted_at' => now(),
        ]);

        return response()->json(['data' => $thirdPartyClaim->fresh()]);
    }

    public function accept(Request $request, ThirdPartyClaim $thirdPartyClaim): JsonResponse
    {
        $data = $request->validate([
            'accepted_amount' => 'required|integer|min:0',
        ]);
        $thirdPartyClaim->update([
            'accepted_amount' => $data['accepted_amount'],
            'status' => ClaimStatus::ACCEPTED,
        ]);

        return response()->json(['data' => $thirdPartyClaim->fresh()]);
    }

    public function reject(Request $request, ThirdPartyClaim $thirdPartyClaim): JsonResponse
    {
        $data = $request->validate(['rejection_reason' => 'required|string|max:255']);
        $thirdPartyClaim->update([
            'status' => ClaimStatus::REJECTED,
            'rejection_reason' => $data['rejection_reason'],
        ]);

        return response()->json(['data' => $thirdPartyClaim->fresh()]);
    }

    public function settle(Request $request, ThirdPartyClaim $thirdPartyClaim): JsonResponse
    {
        $data = $request->validate([
            'amount' => 'required|integer|min:1',
            'reference' => 'nullable|string|max:100',
        ]);

        $claim = DB::transaction(function () use ($thirdPartyClaim, $data) {
            $settlement = ThirdPartySettlement::create([
                'third_party_claim_id' => $thirdPartyClaim->id,
                'amount' => $data['amount'],
                'reference' => $data['reference'] ?? null,
                'settled_at' => now(),
                'created_by' => auth()->id(),
            ]);

            $settled = (int) $thirdPartyClaim->settlements()->sum('amount');
            $accepted = (int) $thirdPartyClaim->accepted_amount;
            $status = $settled >= $accepted ? ClaimStatus::SETTLED : ClaimStatus::PARTIALLY_PAID;
            $thirdPartyClaim->update([
                'settled_amount' => $settled,
                'status' => $status,
            ]);

            return $thirdPartyClaim->fresh(['settlements', 'payer', 'invoice']);
        });

        return response()->json(['data' => $claim]);
    }

    public function receivablesReport(): JsonResponse
    {
        $rows = ThirdPartyClaim::query()
            ->selectRaw('payer_id, sum(claimed_amount) as claimed, sum(settled_amount) as settled, sum(accepted_amount - settled_amount) as outstanding')
            ->whereNotIn('status', [ClaimStatus::REJECTED->value, ClaimStatus::DRAFT->value])
            ->groupBy('payer_id')
            ->get()
            ->map(function ($row) {
                $row->payer = \App\Models\Payer::select('id', 'code', 'name', 'type')->find($row->payer_id);

                return $row;
            });

        return response()->json(['data' => $rows]);
    }
}
