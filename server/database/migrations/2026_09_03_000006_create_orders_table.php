<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('ref')->unique();           // human reference: "LM-8408"
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('created');
            // created → paid → processing → shipped → delivered  (| cancelled)

            // Totals recomputed server-side at placement time (never trust the client)
            $table->decimal('subtotal', 10, 2);
            $table->decimal('shipping', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0); // reserved for coupons
            $table->decimal('total', 10, 2);

            // Snapshot of the shipping address (customer may change it later)
            $table->string('shipping_name');
            $table->string('shipping_email');
            $table->string('shipping_phone')->nullable();
            $table->string('shipping_address');
            $table->string('shipping_city');
            $table->string('shipping_country', 2);

            $table->json('events');                    // [{status, at, note}] — tracking timeline
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
