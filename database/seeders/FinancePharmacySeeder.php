<?php

namespace Database\Seeders;

use App\Enums\PayerType;
use App\Enums\ProductUnit;
use App\Enums\TariffCategory;
use App\Enums\UserRole;
use App\Models\CostCenter;
use App\Models\Hospital;
use App\Models\Payer;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\StockLot;
use App\Models\Supplier;
use App\Models\TariffItem;
use App\Models\User;
use App\Services\Pharmacy\StockService;
use App\Enums\StockMovementType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FinancePharmacySeeder extends Seeder
{
    public function run(): void
    {
        $hospital = Hospital::first();
        if ($hospital) {
            $hospital->update(['currency_code' => 'XOF', 'currency_label' => 'F CFA']);
        }

        foreach ([
            ['email' => 'cashier@medipass.test', 'full_name' => 'Awa Caissière', 'role' => UserRole::CASHIER],
            ['email' => 'accountant@medipass.test', 'full_name' => 'Ibrahima Comptable', 'role' => UserRole::ACCOUNTANT],
            ['email' => 'pharmacist@medipass.test', 'full_name' => 'Fatou Pharmacienne', 'role' => UserRole::PHARMACIST],
            ['email' => 'storekeeper@medipass.test', 'full_name' => 'Moussa Magasinier', 'role' => UserRole::STOREKEEPER],
        ] as $u) {
            User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'full_name' => $u['full_name'],
                    'name' => $u['full_name'],
                    'password' => Hash::make('password'),
                    'role' => $u['role'],
                    'hospital_id' => $hospital?->id,
                    'email_verified_at' => now(),
                ]
            );
        }

        $centers = [
            ['code' => 'NEURO', 'name' => 'Neurologie'],
            ['code' => 'URGENCES', 'name' => 'Urgences'],
            ['code' => 'LABO', 'name' => 'Laboratoire'],
            ['code' => 'IMAGERIE', 'name' => 'Imagerie'],
            ['code' => 'PHARMA', 'name' => 'Pharmacie'],
            ['code' => 'HOSP', 'name' => 'Hospitalisation'],
        ];
        foreach ($centers as $c) {
            CostCenter::updateOrCreate(['code' => $c['code']], [...$c, 'is_active' => true]);
        }

        $neuro = CostCenter::where('code', 'NEURO')->first();
        $pharma = CostCenter::where('code', 'PHARMA')->first();
        $labo = CostCenter::where('code', 'LABO')->first();
        $img = CostCenter::where('code', 'IMAGERIE')->first();
        $hosp = CostCenter::where('code', 'HOSP')->first();

        foreach ([
            ['code' => 'CNAM', 'name' => 'CNAM / Assurance maladie', 'type' => PayerType::INSURANCE, 'default_coverage_rate' => 80],
            ['code' => 'IPM', 'name' => 'IPM Entreprise', 'type' => PayerType::EMPLOYER, 'default_coverage_rate' => 70],
            ['code' => 'ONG', 'name' => 'ONG Partenaire', 'type' => PayerType::NGO, 'default_coverage_rate' => 100],
            ['code' => 'ETAT', 'name' => 'Prise en charge État', 'type' => PayerType::STATE, 'default_coverage_rate' => 100],
            ['code' => 'PART', 'name' => 'Particulier (sans couverture)', 'type' => PayerType::OTHER, 'default_coverage_rate' => 0],
        ] as $p) {
            Payer::updateOrCreate(['code' => $p['code']], [...$p, 'is_active' => true]);
        }

        $tariffs = [
            ['code' => 'CONS-NEURO', 'label' => 'Consultation neurologie', 'category' => TariffCategory::CONSULTATION, 'unit_price' => 15000, 'cost_center_id' => $neuro?->id],
            ['code' => 'CONS-URG', 'label' => 'Consultation urgences', 'category' => TariffCategory::CONSULTATION, 'unit_price' => 10000, 'cost_center_id' => CostCenter::where('code', 'URGENCES')->value('id')],
            ['code' => 'HOSP-J', 'label' => 'Hospitalisation / jour', 'category' => TariffCategory::HOSPITALIZATION, 'unit_price' => 35000, 'cost_center_id' => $hosp?->id],
            ['code' => 'EEG', 'label' => 'EEG', 'category' => TariffCategory::ACT, 'unit_price' => 45000, 'cost_center_id' => $neuro?->id],
            ['code' => 'EMG', 'label' => 'EMG', 'category' => TariffCategory::ACT, 'unit_price' => 55000, 'cost_center_id' => $neuro?->id],
            ['code' => 'IRM-C', 'label' => 'IRM cérébrale', 'category' => TariffCategory::IMAGING, 'unit_price' => 125000, 'cost_center_id' => $img?->id],
            ['code' => 'BIO-STD', 'label' => 'Bilan biologique standard', 'category' => TariffCategory::LAB, 'unit_price' => 25000, 'cost_center_id' => $labo?->id],
        ];
        foreach ($tariffs as $t) {
            TariffItem::updateOrCreate(['code' => $t['code']], [...$t, 'is_active' => true]);
        }

        $catMed = ProductCategory::updateOrCreate(['code' => 'MED'], ['name' => 'Médicaments', 'is_active' => true]);
        $catCons = ProductCategory::updateOrCreate(['code' => 'CONS'], ['name' => 'Consommables', 'is_active' => true]);

        Supplier::updateOrCreate(
            ['code' => 'COPHARMA'],
            ['name' => 'Copharma Distribution', 'phone' => '+221770000001', 'tax_id' => 'NINEA-DEMO', 'lead_time_days' => 7, 'is_active' => true]
        );
        Supplier::updateOrCreate(
            ['code' => 'LABOREX'],
            ['name' => 'Laborex Sénégal', 'phone' => '+221770000002', 'lead_time_days' => 5, 'is_active' => true]
        );

        $products = [
            ['code' => 'LEV-500', 'name' => 'Lévétiracétam 500 mg', 'dci' => 'Lévétiracétam', 'form' => 'Comprimé', 'dosage' => '500 mg', 'unit' => ProductUnit::TABLET, 'sale_price' => 250, 'min_stock' => 50],
            ['code' => 'VAL-500', 'name' => 'Valproate 500 mg', 'dci' => 'Acide valproïque', 'form' => 'Comprimé', 'dosage' => '500 mg', 'unit' => ProductUnit::TABLET, 'sale_price' => 300, 'min_stock' => 40],
            ['code' => 'CARB-200', 'name' => 'Carbamazépine 200 mg', 'dci' => 'Carbamazépine', 'form' => 'Comprimé', 'dosage' => '200 mg', 'unit' => ProductUnit::TABLET, 'sale_price' => 150, 'min_stock' => 60],
            ['code' => 'ASP-100', 'name' => 'Aspirine 100 mg', 'dci' => 'Acide acétylsalicylique', 'form' => 'Comprimé', 'dosage' => '100 mg', 'unit' => ProductUnit::TABLET, 'sale_price' => 50, 'min_stock' => 100],
            ['code' => 'PARA-500', 'name' => 'Paracétamol 500 mg', 'dci' => 'Paracétamol', 'form' => 'Comprimé', 'dosage' => '500 mg', 'unit' => ProductUnit::TABLET, 'sale_price' => 25, 'min_stock' => 200],
            ['code' => 'SER-NaCl', 'name' => 'Sérum physiologique 500 ml', 'dci' => 'NaCl 0,9%', 'form' => 'Poche', 'dosage' => '500 ml', 'unit' => ProductUnit::UNIT, 'sale_price' => 1500, 'min_stock' => 20],
        ];

        $stock = app(StockService::class);
        foreach ($products as $i => $p) {
            $product = Product::updateOrCreate(
                ['code' => $p['code']],
                [
                    ...$p,
                    'product_category_id' => $i === 5 ? $catCons->id : $catMed->id,
                    'cost_center_id' => $pharma?->id,
                    'requires_expiry' => true,
                    'is_active' => true,
                ]
            );

            if (! StockLot::where('product_id', $product->id)->exists()) {
                $stock->increaseLot(
                    $product->id,
                    'LOT-DEMO-'.($i + 1),
                    100 + ($i * 10),
                    (int) round($product->sale_price * 0.6),
                    now()->addMonths(12 + $i)->toDateString(),
                    'Armoire A'.($i % 3 + 1),
                    StockMovementType::IN_PURCHASE,
                    null,
                    null,
                    'Stock initial démo'
                );
            }
        }
    }
}
