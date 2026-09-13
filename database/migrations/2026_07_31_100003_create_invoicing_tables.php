<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number', 40)->unique();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('episode_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 30)->default('DRAFT');
            $table->string('currency_code', 3)->default('XOF');
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('discount_total')->default(0);
            $table->unsignedBigInteger('total')->default(0);
            $table->unsignedBigInteger('patient_share')->default(0);
            $table->unsignedBigInteger('third_party_share')->default(0);
            $table->unsignedBigInteger('amount_paid')->default(0);
            $table->unsignedBigInteger('balance_due')->default(0);
            $table->timestamp('issued_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('invoice_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tariff_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable(); // FK added after products table
            $table->string('label');
            $table->decimal('quantity', 12, 2)->default(1);
            $table->unsignedBigInteger('unit_price')->default(0);
            $table->unsignedBigInteger('discount')->default(0);
            $table->unsignedBigInteger('line_total')->default(0);
            $table->foreignId('cost_center_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('credit_notes', function (Blueprint $table) {
            $table->id();
            $table->string('number', 40)->unique();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('total')->default(0);
            $table->string('reason')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('credit_note_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_note_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_line_id')->nullable()->constrained()->nullOnDelete();
            $table->string('label');
            $table->decimal('quantity', 12, 2)->default(1);
            $table->unsignedBigInteger('unit_price')->default(0);
            $table->unsignedBigInteger('line_total')->default(0);
            $table->timestamps();
        });

        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opened_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('OPEN');
            $table->unsignedBigInteger('opening_float')->default(0);
            $table->unsignedBigInteger('expected_cash')->nullable();
            $table->unsignedBigInteger('closing_amount')->nullable();
            $table->bigInteger('variance')->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cash_session_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('mode', 30); // CASH, MOBILE_MONEY, CARD, BANK_TRANSFER, CHEQUE
            $table->string('reference')->nullable();
            $table->timestamp('paid_at');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('third_party_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payer_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('claimed_amount')->default(0);
            $table->unsignedBigInteger('accepted_amount')->default(0);
            $table->unsignedBigInteger('settled_amount')->default(0);
            $table->string('status', 30)->default('DRAFT');
            $table->timestamp('submitted_at')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('third_party_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('third_party_claim_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('reference')->nullable();
            $table->timestamp('settled_at');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('analytical_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_line_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cost_center_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('axis', 50)->nullable();
            $table->timestamps();
        });

        Schema::create('accounting_journal_entries', function (Blueprint $table) {
            $table->id();
            $table->date('entry_date');
            $table->string('label');
            $table->unsignedBigInteger('debit')->default(0);
            $table->unsignedBigInteger('credit')->default(0);
            $table->foreignId('cost_center_id')->nullable()->constrained()->nullOnDelete();
            $table->nullableMorphs('source');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_journal_entries');
        Schema::dropIfExists('analytical_allocations');
        Schema::dropIfExists('third_party_settlements');
        Schema::dropIfExists('third_party_claims');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('cash_sessions');
        Schema::dropIfExists('credit_note_lines');
        Schema::dropIfExists('credit_notes');
        Schema::dropIfExists('invoice_lines');
        Schema::dropIfExists('invoices');
    }
};
