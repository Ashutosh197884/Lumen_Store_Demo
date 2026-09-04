<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->nullOnDelete(); // keep history if product is deleted
            $table->string('name');                    // snapshot (product names change)
            $table->string('art')->nullable();         // snapshot for receipts/timeline tiles
            $table->unsignedInteger('qty');
            $table->decimal('unit_price', 10, 2);      // snapshot of price at purchase
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
