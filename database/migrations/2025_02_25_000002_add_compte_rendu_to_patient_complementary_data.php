<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_complementary_data', function (Blueprint $table) {
            $table->longText('compte_rendu')->nullable()->after('mode_sortie');
        });
    }

    public function down(): void
    {
        Schema::table('patient_complementary_data', function (Blueprint $table) {
            $table->dropColumn('compte_rendu');
        });
    }
};
