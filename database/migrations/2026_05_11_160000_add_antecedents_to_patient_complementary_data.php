<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_complementary_data', function (Blueprint $table) {
            $table->json('antecedents')->nullable()->after('compte_rendu');
        });
    }

    public function down(): void
    {
        Schema::table('patient_complementary_data', function (Blueprint $table) {
            $table->dropColumn('antecedents');
        });
    }
};
