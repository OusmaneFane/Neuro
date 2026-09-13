<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::query();
        $hospitalId = auth()->user()?->hospital_id;
        if ($hospitalId) {
            $query->where(function ($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId)
                    ->orWhere('role', UserRole::PATIENT);
            });
        }

        $byRole = (clone $query)->selectRaw('role, count(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role')
            ->map(fn ($v) => (int) $v)
            ->all();

        $roles = ['ADMIN', 'DOCTOR', 'INTERN', 'NURSE', 'DS', 'ARCHIVIST', 'SECRETARY', 'CASHIER', 'ACCOUNTANT', 'PHARMACIST', 'STOREKEEPER', 'PATIENT'];
        $counts = [];
        foreach ($roles as $r) {
            $counts[$r] = $byRole[$r] ?? 0;
        }

        return response()->json([
            'total' => (clone $query)->count(),
            'by_role' => $counts,
        ]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()
            ->with('hospital:id,name')
            ->orderBy('full_name');

        $hospitalId = auth()->user()?->hospital_id;
        if ($hospitalId) {
            $query->where(function ($q) use ($hospitalId) {
                $q->where('hospital_id', $hospitalId)
                    ->orWhere('role', UserRole::PATIENT);
            });
        }

        if (!$request->boolean('include_patients')) {
            $query->where('role', '!=', UserRole::PATIENT);
        }

        if ($search = $request->input('query')) {
            $term = '%' . $search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('full_name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $perPage = min((int) $request->input('limit', 20), 100);
        $users = $query->paginate($perPage);

        return UserResource::collection($users);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'full_name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'in:ADMIN,DOCTOR,INTERN,NURSE,DS,ARCHIVIST,SECRETARY,CASHIER,ACCOUNTANT,PHARMACIST,STOREKEEPER,PATIENT'],
            'hospital_id' => ['nullable', 'exists:hospitals,id'],
        ]);

        $user = User::create([
            'email' => $validated['email'],
            'password' => $validated['password'],
            'full_name' => $validated['full_name'],
            'role' => $validated['role'],
            'hospital_id' => $validated['role'] !== 'PATIENT' ? ($validated['hospital_id'] ?? auth()->user()?->hospital_id) : null,
        ]);

        return response()->json(new UserResource($user->load('hospital')), 201);
    }
}
