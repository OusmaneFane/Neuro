<?php

use App\Enums\UserRole;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicalNoteController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EpisodeController;
use App\Http\Controllers\Api\Finance\AnalyticsController;
use App\Http\Controllers\Api\Finance\CashSessionController;
use App\Http\Controllers\Api\Finance\CostCenterController;
use App\Http\Controllers\Api\Finance\InvoiceController;
use App\Http\Controllers\Api\Finance\PatientCoverageController;
use App\Http\Controllers\Api\Finance\PayerController;
use App\Http\Controllers\Api\Finance\TariffItemController;
use App\Http\Controllers\Api\Finance\ThirdPartyClaimController;
use App\Http\Controllers\Api\HospitalController;
use App\Http\Controllers\Api\PatientComplementaryDataController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PatientPortalController;
use App\Http\Controllers\Api\Pharmacy\InventoryCountController;
use App\Http\Controllers\Api\Pharmacy\PharmacyDashboardController;
use App\Http\Controllers\Api\Pharmacy\PrescriptionController;
use App\Http\Controllers\Api\Pharmacy\ProductController;
use App\Http\Controllers\Api\Pharmacy\PurchaseOrderController;
use App\Http\Controllers\Api\Pharmacy\StockController;
use App\Http\Controllers\Api\Pharmacy\SupplierController;
use App\Http\Controllers\Api\ShareTokenController;
use App\Http\Controllers\Api\ShareViewController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

$staff = implode(',', UserRole::hospitalStaffValues());
$clinical = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canAccessClinical()));
$clinicalWrite = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canWriteClinical()));
$patientAccess = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canLookupPatients()));
$finance = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canWriteFinance()));
$financeRead = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canAccessFinance()));
$pharmacy = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canAccessPharmacy()));
$prescriptionRead = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canReadPrescriptions()));
$prescriptionWrite = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canWritePrescriptions()));
$dispense = implode(',', UserRole::valuesMatching(fn (UserRole $r) => $r->canDispense()));

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/refresh', [AuthController::class, 'refresh']);

Route::middleware('auth:api')->group(function () use (
    $staff,
    $clinical,
    $clinicalWrite,
    $patientAccess,
    $finance,
    $financeRead,
    $pharmacy,
    $prescriptionRead,
    $prescriptionWrite,
    $dispense,
) {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->middleware('role:'.$staff);

    Route::prefix('patient')->middleware('role:PATIENT')->group(function () {
        Route::get('/me', [PatientPortalController::class, 'me']);
        Route::get('/me/episodes', [PatientPortalController::class, 'episodes']);
        Route::get('/me/documents', [PatientPortalController::class, 'documents']);
        Route::get('/me/documents/{document}', [DocumentController::class, 'downloadForPatient']);
        Route::post('/me/share-tokens', [ShareTokenController::class, 'store']);
    });

    Route::prefix('episodes')->middleware('role:'.$clinical)->group(function () {
        Route::get('/', [EpisodeController::class, 'index']);
    });

    Route::prefix('users')->middleware('role:ADMIN')->group(function () {
        Route::get('/stats', [UserController::class, 'stats']);
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
    });

    Route::get('/hospitals', [HospitalController::class, 'index'])->middleware('role:ADMIN');

    Route::prefix('documents')->middleware('role:'.$clinical)->group(function () {
        Route::get('/stats', [DocumentController::class, 'stats']);
        Route::get('/recent', [DocumentController::class, 'recent']);
    });

    // —— Patients (lecture élargie, écriture clinique) ——
    Route::prefix('patients')->group(function () use (
        $patientAccess,
        $clinical,
        $clinicalWrite,
        $financeRead,
        $finance,
        $prescriptionRead,
        $prescriptionWrite,
    ) {
        Route::middleware('role:'.$patientAccess)->group(function () {
            Route::get('/stats', [PatientController::class, 'stats']);
            Route::get('/', [PatientController::class, 'index']);
            Route::get('/{patient}', [PatientController::class, 'show']);
        });

        Route::middleware('role:'.$clinicalWrite)->group(function () {
            Route::post('/', [PatientController::class, 'store']);
            Route::patch('/{patient}', [PatientController::class, 'update']);
            Route::post('/{patient}/episodes', [EpisodeController::class, 'store']);
            Route::post('/{patient}/documents', [DocumentController::class, 'store']);
            Route::post('/{patient}/clinical-notes', [ClinicalNoteController::class, 'store']);
            Route::delete('/{patient}/clinical-notes/{clinicalNote}', [ClinicalNoteController::class, 'destroy']);
            Route::put('/{patient}/complementary-data', [PatientComplementaryDataController::class, 'update']);
        });

        Route::middleware('role:'.$clinical)->group(function () {
            Route::get('/{patient}/episodes', [PatientController::class, 'episodes']);
            Route::get('/{patient}/documents', [DocumentController::class, 'index']);
            Route::get('/{patient}/documents/{document}', [DocumentController::class, 'download']);
            Route::post('/{patient}/share-tokens', [ShareTokenController::class, 'store']);
            Route::get('/{patient}/clinical-notes', [ClinicalNoteController::class, 'index']);
            Route::get('/{patient}/complementary-data', [PatientComplementaryDataController::class, 'show']);
            Route::get('/{patient}/dossier-pdf', [PatientController::class, 'exportDossierPdf']);
        });

        Route::middleware('role:'.$financeRead)->group(function () {
            Route::get('/{patient}/coverages', [PatientCoverageController::class, 'index']);
        });
        Route::middleware('role:'.$finance)->group(function () {
            Route::post('/{patient}/coverages', [PatientCoverageController::class, 'store']);
            Route::patch('/{patient}/coverages/{coverage}', [PatientCoverageController::class, 'update']);
            Route::delete('/{patient}/coverages/{coverage}', [PatientCoverageController::class, 'destroy']);
        });

        Route::middleware('role:'.$prescriptionRead)->group(function () {
            Route::get('/{patient}/prescriptions', [PrescriptionController::class, 'forPatient']);
        });
        Route::middleware('role:'.$prescriptionWrite)->group(function () {
            Route::post('/{patient}/prescriptions', [PrescriptionController::class, 'store']);
        });
    });

    // —— Finances ——
    Route::middleware('role:'.$financeRead)->group(function () {
        Route::get('/finance/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/analytics/by-cost-center', [AnalyticsController::class, 'byCostCenter']);
        Route::get('/analytics/by-cost-center/export', [AnalyticsController::class, 'exportCostCenterCsv']);
        Route::get('/accounting/journal', [AnalyticsController::class, 'journal']);
        Route::get('/payers', [PayerController::class, 'index']);
        Route::get('/cost-centers', [CostCenterController::class, 'index']);
        Route::get('/tariff-items', [TariffItemController::class, 'index']);
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf']);
        Route::get('/cash-sessions', [CashSessionController::class, 'index']);
        Route::get('/cash-sessions/current', [CashSessionController::class, 'current']);
        Route::get('/payments/{payment}/receipt', [CashSessionController::class, 'receiptPdf']);
        Route::get('/third-party-claims', [ThirdPartyClaimController::class, 'index']);
        Route::get('/third-party-claims/receivables', [ThirdPartyClaimController::class, 'receivablesReport']);
        Route::get('/third-party-claims/{thirdPartyClaim}', [ThirdPartyClaimController::class, 'show']);
    });

    Route::middleware('role:'.$finance)->group(function () {
        Route::post('/payers', [PayerController::class, 'store']);
        Route::patch('/payers/{payer}', [PayerController::class, 'update']);
        Route::post('/cost-centers', [CostCenterController::class, 'store']);
        Route::patch('/cost-centers/{costCenter}', [CostCenterController::class, 'update']);
        Route::post('/tariff-items', [TariffItemController::class, 'store']);
        Route::patch('/tariff-items/{tariffItem}', [TariffItemController::class, 'update']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::patch('/invoices/{invoice}', [InvoiceController::class, 'update']);
        Route::post('/invoices/{invoice}/issue', [InvoiceController::class, 'issue']);
        Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
        Route::post('/invoices/{invoice}/credit-notes', [InvoiceController::class, 'creditNote']);
        Route::post('/cash-sessions/open', [CashSessionController::class, 'open']);
        Route::post('/cash-sessions/{cashSession}/close', [CashSessionController::class, 'close']);
        Route::post('/payments', [CashSessionController::class, 'storePayment']);
        Route::post('/third-party-claims/{thirdPartyClaim}/submit', [ThirdPartyClaimController::class, 'submit']);
        Route::post('/third-party-claims/{thirdPartyClaim}/accept', [ThirdPartyClaimController::class, 'accept']);
        Route::post('/third-party-claims/{thirdPartyClaim}/reject', [ThirdPartyClaimController::class, 'reject']);
        Route::post('/third-party-claims/{thirdPartyClaim}/settle', [ThirdPartyClaimController::class, 'settle']);
    });

    // Catalogue médicaments : lecture pour prescripteurs + pharmacie
    Route::middleware('role:'.$prescriptionRead)->group(function () {
        Route::get('/product-categories', [ProductController::class, 'categories']);
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
    });

    // —— Pharmacie (module stock / appro) ——
    Route::middleware('role:'.$pharmacy)->group(function () {
        Route::get('/pharmacy/dashboard', [PharmacyDashboardController::class, 'stats']);
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::get('/stock/lots', [StockController::class, 'lots']);
        Route::get('/stock/movements', [StockController::class, 'movements']);
        Route::get('/stock/alerts', [StockController::class, 'alerts']);
        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show']);
        Route::get('/purchase-orders/{purchaseOrder}/pdf', [PurchaseOrderController::class, 'pdf']);
        Route::get('/inventory-counts', [InventoryCountController::class, 'index']);
        Route::get('/inventory-counts/{inventoryCount}', [InventoryCountController::class, 'show']);
        Route::post('/product-categories', [ProductController::class, 'storeCategory']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::patch('/products/{product}', [ProductController::class, 'update']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update']);
        Route::post('/stock/lots/in', [StockController::class, 'manualIn']);
        Route::post('/stock/lots/{stockLot}/adjust', [StockController::class, 'adjust']);
        Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
        Route::post('/purchase-orders/{purchaseOrder}/send', [PurchaseOrderController::class, 'send']);
        Route::post('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
        Route::post('/supplier-returns', [PurchaseOrderController::class, 'storeReturn']);
        Route::post('/inventory-counts', [InventoryCountController::class, 'store']);
        Route::patch('/inventory-counts/{inventoryCount}/lines', [InventoryCountController::class, 'updateLines']);
        Route::post('/inventory-counts/{inventoryCount}/validate', [InventoryCountController::class, 'validateCount']);
    });

    // Ordonnances globales + délivrance
    Route::middleware('role:'.$prescriptionRead)->group(function () {
        Route::get('/prescriptions', [PrescriptionController::class, 'index']);
        Route::get('/prescriptions/{prescription}', [PrescriptionController::class, 'show']);
        Route::get('/prescriptions/{prescription}/pdf', [PrescriptionController::class, 'pdf']);
    });
    Route::middleware('role:'.$dispense)->group(function () {
        Route::post('/prescriptions/{prescription}/dispense', [PrescriptionController::class, 'dispense']);
    });
});

Route::get('/share/{token}', [ShareViewController::class, 'show']);
