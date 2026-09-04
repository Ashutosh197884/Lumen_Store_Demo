<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('stripe');
            $table->string('session_id')->nullable();  // Stripe Checkout session id
            $table->string('payment_intent')->nullable();
            $table->string('status')->default('pending'); // pending | paid | refunded | failed
            $table->decimal('amount', 10, 2);
            $table->string('card_brand')->nullable();
            $table->string('card_last4', 4)->nullable();
            $table->string('paypal_order_id')->nullable();  // PayPal Orders v2 id
            $table->string('paypal_email')->nullable();     // payer email (PayPal)
            $table->json('raw')->nullable();           // full webhook payload for audits
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
