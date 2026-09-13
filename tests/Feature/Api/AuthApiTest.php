<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_tokens(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'accessToken',
            'refreshToken',
            'expiresIn',
            'user' => ['id', 'email', 'full_name', 'role'],
        ]);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'unknown@example.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(401);
    }
}
