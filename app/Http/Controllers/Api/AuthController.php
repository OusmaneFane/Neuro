<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $credentials = $request->only('email', 'password');

        if (! $token = JWTAuth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = auth()->user();
        $refreshTtl = config('jwt.refresh_ttl', 10080); // 7 days in minutes
        $refreshToken = JWTAuth::factory()->setTTL($refreshTtl)->claims(['type' => 'refresh'])->fromUser($user);

        return response()->json([
            'accessToken' => $token,
            'refreshToken' => $refreshToken,
            'expiresIn' => config('jwt.ttl') * 60,
            'user' => new UserResource($user),
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        try {
            $refreshToken = $request->bearerToken() ?: $request->input('refresh_token');
            if (! $refreshToken) {
                return response()->json(['message' => 'Refresh token required.'], 401);
            }

            $user = JWTAuth::setToken($refreshToken)->authenticate();
            $newToken = JWTAuth::fromUser($user);
            $refreshTtl = config('jwt.refresh_ttl', 10080);
            $newRefreshToken = JWTAuth::factory()->setTTL($refreshTtl)->claims(['type' => 'refresh'])->fromUser($user);

            return response()->json([
                'accessToken' => $newToken,
                'refreshToken' => $newRefreshToken,
                'expiresIn' => config('jwt.ttl') * 60,
                'user' => new UserResource($user),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token refresh failed.'], 401);
        }
    }

    public function logout(): JsonResponse
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['message' => 'Successfully logged out.']);
    }

    public function me(): JsonResponse
    {
        return response()->json(['user' => new UserResource(auth()->user())]);
    }
}
