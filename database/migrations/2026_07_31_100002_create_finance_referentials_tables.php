<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cost_centers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->foreignId('parent_id')->nullable()->constrained('cost_centers')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('payers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->string('type', 30); // INSURANCE, EMPLOYER, NGO, STATE, OTHER
            $table->string('contact_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->unsignedTinyInteger('default_coverage_rate')->default(0); // 0-100
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('patient_coverages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payer_id')->constrained()->cascadeOnDelete();
            $table->string('member_number')->nullable();
            $table->unsignedTinyInteger('coverage_rate')->default(0);
            $table->unsignedBigInteger('ceiling_amount')->nullable();
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('tariff_items', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('label');
            $table->string('category', 30); // CONSULTATION, HOSPITALIZATION, ACT, LAB, IMAGING, DRUG, OTHER
            $table->unsignedBigInteger('unit_price')->default(0); // XOF integer
            $table->foreignId('cost_center_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tariff_items');
        Schema::dropIfExists('patient_coverages');
        Schema::dropIfExists('payers');
        Schema::dropIfExists('cost_centers');
    }
};
