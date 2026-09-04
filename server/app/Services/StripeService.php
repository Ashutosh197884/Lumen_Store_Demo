<?php

namespace App\Services;

use Stripe\Checkout\Session;
use Stripe\StripeClient;

class StripeService
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Create a hosted Checkout session. Prices must be in the smallest currency
     * unit (cents), which is why line totals are multiplied by 100.
     *
     * @param  array{ref: string, lines: array<int, array{name:string,qty:int,amount:float}>}  $order
     */
    public function createCheckoutSession(array $order, string $successUrl, string $cancelUrl): Session
    {
        return $this->stripe->checkout->sessions->create([
            'mode' => 'payment',
            'client_reference_id' => $order['ref'],
            'metadata' => ['order_ref' => $order['ref']],
            'line_items' => collect($order['lines'])->map(fn ($l) => [
                'quantity' => $l['qty'],
                'price_data' => [
                    'currency' => strtolower(config('app.currency', 'usd')),
                    'unit_amount' => (int) round($l['amount'] * 100),
                    'product_data' => ['name' => $l['name']],
                ],
            ])->values()->all(),
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'payment_method_types' => ['card'],
        ]);
    }

    /** Verify + decode a webhook payload. Throws on bad signatures. */
    public function verifyWebhook(string $payload, string $signatureHeader): object
    {
        return \Stripe\Webhook::constructEvent(
            $payload,
            $signatureHeader,
            config('services.stripe.webhook_secret'),
        );
    }
}
