<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();          // stable URL + API id (matches client mock ids)
            $table->string('name');
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->json('features')->nullable();      // ["Free returns within 30 days", …]
            $table->decimal('price', 10, 2);
            $table->decimal('compare_at_price', 10, 2)->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(5);
            $table->string('sku')->nullable();
            $table->string('unit')->default('each');
            $table->json('badges')->nullable();        // ["Best Seller", "New", …]
            $table->string('art')->nullable();         // emoji/placeholder until real images
            $table->decimal('rating', 3, 2)->default(4.5);
            $table->unsignedInteger('review_count')->default(0);
            $table->boolean('featured')->default(false);
            $table->boolean('active')->default(true);  // hide from storefront, keep in admin
            $table->timestamps();

            $table->index(['active', 'category_id']);
            $table->index(['featured']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
