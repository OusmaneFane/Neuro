<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancePharmacyApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_accountant_can_access_finance_dashboard(): void
    {
        $user = User::where('email', 'accountant@medipass.test')->firstOrFail();

        $this->actingAs($user, 'api')
            ->getJson('/api/finance/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'revenue_today',
                'revenue_month',
                'payments_today',
                'open_invoices',
            ]);
    }

    public function test_pharmacist_can_access_pharmacy_dashboard(): void
    {
        $user = User::where('email', 'pharmacist@medipass.test')->firstOrFail();

        $this->actingAs($user, 'api')
            ->getJson('/api/pharmacy/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'products_active',
                'stock_valuation',
                'alerts',
            ]);
    }

    public function test_accountant_cannot_access_pharmacy_mutations_area(): void
    {
        $user = User::where('email', 'accountant@medipass.test')->firstOrFail();

        $this->actingAs($user, 'api')
            ->getJson('/api/pharmacy/dashboard')
            ->assertForbidden();
    }
}
