<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('delta');                  // -qty on sale, +qty on restock
            $table->string('reason');                  // "order LM-8408" | "manual restock" | …
            $table->unsignedInteger('stock_after');
            $table->nullableMorphs('actor');           // who caused it (admin or the system)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};
