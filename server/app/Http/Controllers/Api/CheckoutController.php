<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Services\PayPalService;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly StripeService $stripe,
        private readonly PayPalService $paypal,
    ) {
    }

    public function session(Request $request)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
            'customer.name' => ['required', 'string', 'max:255'],
            'customer.email' => ['required', 'email'],
            'customer.phone' => ['nullable', 'string', 'max:64'],
            'customer.address' => ['required', 'string', 'max:255'],
            'customer.city' => ['required', 'string', 'max:255'],
            'customer.country' => ['required', 'string', 'size:2'],
            'payment_method' => ['sometimes', 'in:stripe,paypal'],
        ]);

        $customer = $data['customer'];

        // ── 1. Build lines server-side from stored prices (never trust client totals) ──
        $lines = [];
        foreach ($data['items'] as $item) {
            $product = Product::where('slug', $item['product_id'])->live()->first();

            if (! $product) {
                throw ValidationException::withMessages(['items' => 'A product in your cart is no longer available.']);
            }
            if ($product->stock < $item['qty']) {
                throw ValidationException::withMessages([
                    'items' => "Only {$product->stock} left of “{$product->name}”.",
                ]);
            }

            $lines[] = [
                'product' => $product,
                'qty' => $item['qty'],
                'unit' => (float) $product->price,
            ];
        }

        $subtotal = round(array_sum(array_map(fn ($l) => $l['unit'] * $l['qty'], $lines)), 2);
        $shipping = $subtotal >= 150 ? 0 : 5.99;
        $total = round($subtotal + $shipping, 2);

        // ── 2. Persist order (status: created — payment not yet confirmed) ──
        $order = DB::transaction(function () use ($lines, $customer, $subtotal, $shipping, $total) {
            $customerRow = Customer::firstOrCreateByEmail([
                'name' => $customer['name'],
                'email' => $customer['email'],
                'phone' => $customer['phone'] ?? null,
                'city' => $customer['city'].', '.$customer['country'],
                'country' => $customer['country'],
            ]);

            $order = Order::create([
                'ref' => Order::nextRef(),
                'customer_id' => $customerRow->id,
                'status' => Order::STATUS_CREATED,
                'subtotal' => $subtotal,
                'shipping' => $shipping,
                'total' => $total,
                'shipping_name' => $customer['name'],
                'shipping_email' => $customer['email'],
                'shipping_phone' => $customer['phone'] ?? null,
                'shipping_address' => $customer['address'],
                'shipping_city' => $customer['city'],
                'shipping_country' => $customer['country'],
                'events' => [],
            ]);
            $order->addEvent(Order::STATUS_CREATED, 'Order received');

            foreach ($lines as $l) {
                $order->items()->create([
                    'product_id' => $l['product']->id,
                    'name' => $l['product']->name,
                    'art' => $l['product']->art,
                    'qty' => $l['qty'],
                    'unit_price' => $l['unit'],
                ]);
            }

            return $order;
        });

        $method = $data['payment_method'] ?? 'stripe';
        $linesArr = array_map(fn ($l) => [
            'name' => $l['product']->name,
            'qty' => $l['qty'],
            'amount' => $l['unit'],
        ], $lines);
        $returnUrl = config('app.frontend_url').'/order/'.$order->ref;
        $cancelUrl = config('app.frontend_url').'/cart';

        // ── 3. Hosted payment session: Stripe Checkout or PayPal approval ──
        if ($method === 'paypal') {
            $pp = $this->paypal->createOrder($linesArr, $total, config('app.currency', 'USD'), $returnUrl, $cancelUrl);

            Payment::create([
                'order_id' => $order->id,
                'provider' => 'paypal',
                'paypal_order_id' => $pp['id'],
                'status' => 'pending',
                'amount' => $total,
            ]);

            return ['approval_url' => $pp['approval_url'], 'order_ref' => $order->ref];
        }

        $session = $this->stripe->createCheckoutSession(
            order: ['ref' => $order->ref, 'lines' => $linesArr],
            successUrl: $returnUrl,
            cancelUrl: $cancelUrl,
        );

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'stripe',
            'session_id' => $session->id,
            'status' => 'pending',
            'amount' => $total,
        ]);

        return ['checkout_url' => $session->url, 'order_ref' => $order->ref];
    }
}
