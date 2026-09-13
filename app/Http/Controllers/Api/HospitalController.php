<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;

class HospitalController extends Controller
{
    public function index(): JsonResponse
    {
        $hospitals = Hospital::orderBy('name')->get(['id', 'name']);

        return response()->json(['data' => $hospitals]);
    }
}
