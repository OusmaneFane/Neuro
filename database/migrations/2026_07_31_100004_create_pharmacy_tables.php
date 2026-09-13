<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->string('dci')->nullable();
            $table->string('form')->nullable();
            $table->string('dosage')->nullable();
            $table->string('unit', 20)->default('UNIT');
            $table->foreignId('product_category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tariff_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cost_center_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('min_stock')->default(0);
            $table->boolean('requires_expiry')->default(true);
            $table->unsignedBigInteger('sale_price')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('invoice_lines', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('tax_id')->nullable(); // NINEA / RCCM
            $table->text('address')->nullable();
            $table->unsignedSmallInteger('lead_time_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('stock_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('lot_number');
            $table->date('expiry_date')->nullable();
            $table->decimal('qty_on_hand', 12, 2)->default(0);
            $table->unsignedBigInteger('unit_cost')->default(0);
            $table->string('location')->nullable();
            $table->timestamps();
            $table->unique(['product_id', 'lot_number']);
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_lot_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30);
            $table->decimal('quantity', 12, 2); // signed conceptually; store absolute + type
            $table->string('reason')->nullable();
            $table->nullableMorphs('reference');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('number', 40)->unique();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->string('status', 30)->default('DRAFT');
            $table->date('ordered_at')->nullable();
            $table->date('expected_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('purchase_order_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity_ordered', 12, 2);
            $table->decimal('quantity_received', 12, 2)->default(0);
            $table->unsignedBigInteger('unit_cost')->default(0);
            $table->timestamps();
        });

        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('number', 40)->unique();
            $table->foreignId('purchase_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->timestamp('received_at');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('goods_receipt_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receipt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_order_line_id')->nullable()->constrained()->nullOnDelete();
            $table->string('lot_number');
            $table->date('expiry_date')->nullable();
            $table->decimal('quantity', 12, 2);
            $table->unsignedBigInteger('unit_cost')->default(0);
            $table->string('location')->nullable();
            $table->timestamps();
        });

        Schema::create('supplier_returns', function (Blueprint $table) {
            $table->id();
            $table->string('number', 40)->unique();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->timestamp('returned_at');
            $table->string('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('supplier_return_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_return_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stock_lot_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 12, 2);
            $table->timestamps();
        });

        Schema::create('inventory_counts', function (Blueprint $table) {
            $table->id();
            $table->string('number', 40)->unique();
            $table->string('status', 30)->default('DRAFT');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('inventory_count_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_count_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stock_lot_id')->constrained()->cascadeOnDelete();
            $table->decimal('system_qty', 12, 2)->default(0);
            $table->decimal('counted_qty', 12, 2)->nullable();
            $table->decimal('variance', 12, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('episode_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 30)->default('DRAFT');
            $table->text('notes')->nullable();
            $table->foreignId('prescribed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('prescribed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 12, 2);
            $table->decimal('quantity_dispensed', 12, 2)->default(0);
            $table->string('dosage_instructions')->nullable();
            $table->unsignedSmallInteger('duration_days')->nullable();
            $table->timestamps();
        });

        Schema::create('dispensations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('dispensed_at');
            $table->foreignId('dispensed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('bill_to_invoice')->default(true);
            $table->timestamps();
        });

        Schema::create('dispensation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispensation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prescription_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stock_lot_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 12, 2);
            $table->unsignedBigInteger('unit_price')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispensation_items');
        Schema::dropIfExists('dispensations');
        Schema::dropIfExists('prescription_items');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('inventory_count_lines');
        Schema::dropIfExists('inventory_counts');
        Schema::dropIfExists('supplier_return_lines');
        Schema::dropIfExists('supplier_returns');
        Schema::dropIfExists('goods_receipt_lines');
        Schema::dropIfExists('goods_receipts');
        Schema::dropIfExists('purchase_order_lines');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stock_lots');
        Schema::dropIfExists('suppliers');
        Schema::table('invoice_lines', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_categories');
    }
};
