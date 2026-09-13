<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->string('currency_code', 3)->default('XOF')->after('name');
            $table->string('currency_label', 20)->default('F CFA')->after('currency_code');
        });
    }

    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->dropColumn(['currency_code', 'currency_label']);
        });
    }
};
