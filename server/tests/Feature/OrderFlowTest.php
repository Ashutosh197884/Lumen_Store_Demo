<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderFlowTest extends TestCase
{
    use RefreshDatabase;

    private function product(float $price = 10.0, int $stock = 20): Product
    {
        $category = Category::create(['slug' => 'audio', 'name' => 'Audio', 'gradient' => null]);

        return Product::create([
            'slug' => 'demo-product',
            'name' => 'Demo Product',
            'category_id' => $category->id,
            'price' => $price,
            'stock' => $stock,
            'active' => true,
        ]);
    }

    private function payload(string $slug, int $qty = 1): array
    {
        return [
            'items' => [['product_id' => $slug, 'qty' => $qty]],
            'customer' => [
                'name' => 'Test Shopper',
                'email' => 'test@example.com',
                'address' => '1 Demo Avenue',
                'city' => 'Cairo',
                'country' => 'EG',
            ],
        ];
    }

    public function test_totals_are_recomputed_server_side(): void
    {
        $this->product(price: 40, stock: 10);

        $res = $this->postJson('/api/checkout', $this->payload('demo-product', 2));
        $res->assertOk()
            ->assertJsonStructure(['checkout_url', 'order_ref']);

        $this->assertDatabaseHas('orders', [
            'ref' => $res->json('order_ref'),
            'status' => 'created',
            'subtotal' => 80.0,
            'shipping' => 5.99, // < 150 → flat fee
            'total' => 85.99,
        ]);

        $this->assertDatabaseCount('order_items', 1);
        $this->assertDatabaseHas('customers', ['email' => 'test@example.com']);

        // Stock untouched until the payment webhook confirms
        $this->assertDatabaseHas('products', ['slug' => 'demo-product', 'stock' => 10]);
    }

    public function test_overselling_is_rejected(): void
    {
        $this->product(stock: 2);

        $res = $this->postJson('/api/checkout', $this->payload('demo-product', 5));
        $res->assertStatus(422);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_free_shipping_over_threshold(): void
    {
        $this->product(price: 150, stock: 5);

        $res = $this->postJson('/api/checkout', $this->payload('demo-product'));
        $res->assertOk();
        $this->assertDatabaseHas('orders', ['shipping' => 0, 'total' => 150.0]);
    }

    public function test_admin_can_update_order_status(): void
    {
        $this->product(price: 30, stock: 9);
        $ref = $this->postJson('/api/checkout', $this->payload('demo-product'))->json('order_ref');

        $admin = \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin-'.uniqid().'@lumen.test',
            'password' => 'demo',
            'role' => 'admin',
        ]);
        $token = $admin->createToken('test')->plainTextToken;

        // Illegal jump (created → shipped) rejected…
        $this->patchJson("/api/orders/{$ref}/status", ['status' => 'shipped'], ['Authorization' => "Bearer $token"])
            ->assertStatus(422);

        // …but the documented lifecycle works
        $this->patchJson("/api/orders/{$ref}/status", ['status' => 'cancelled'], ['Authorization' => "Bearer $token"])
            ->assertOk()
            ->assertJsonPath('status', 'cancelled');
    }
}
