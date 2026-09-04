<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PayPal Orders v2 via the REST API (no extra package needed — plain HTTPS calls).
 *
 * Modes (config/services.php → services.paypal.mode):
 *   mock    — no credentials required; returns a placeholder approval URL so the
 *             whole flow can be demoed end-to-end without a sandbox account.
 *   sandbox — use PayPal sandbox app credentials (recommended for the real test
 *             purchase acceptance criterion).
 *   live    — production credentials.
 */
class PayPalService
{
    private function baseUrl(): string
    {
        return config('services.paypal.mode') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->asJson()
            ->withToken($this->accessToken());
    }

    private function accessToken(): string
    {
        $res = Http::baseUrl($this->baseUrl())
            ->asForm()
            ->withBasicAuth(
                config('services.paypal.client_id'),
                config('services.paypal.secret'),
            )
            ->post('/v1/oauth2/token', ['grant_type' => 'client_credentials'])
            ->throw();

        return $res->json('access_token');
    }

    /**
     * Create an approval order. Returns ['id' => ..., 'approval_url' => ...].
     * The buyer is redirected to the approval URL, then back to $returnUrl.
     *
     * @param  array<int, array{name:string,qty:int,amount:float}>  $lines
     */
    public function createOrder(array $lines, float $total, string $currency, string $returnUrl, string $cancelUrl): array
    {
        if (config('services.paypal.mode') === 'mock') {
            // Demo fallback: no real PayPal call. In production demos you would
            // flip to sandbox mode and get a real www.sandbox.paypal.com URL.
            return [
                'id' => 'MOCK-'.strtoupper(bin2hex(random_bytes(6))),
                'approval_url' => $returnUrl.'?paypal_demo=1',
            ];
        }

        $res = $this->client()->post('/v2/checkout/orders', [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'amount' => [
                    'currency_code' => strtoupper($currency),
                    'value' => number_format($total, 2, '.', ''),
                    'breakdown' => [
                        'item_total' => ['currency_code' => strtoupper($currency), 'value' => number_format(array_sum(array_map(fn ($l) => $l['amount'] * $l['qty'], $lines)), 2, '.', '')],
                        'shipping' => ['currency_code' => strtoupper($currency), 'value' => number_format(max(0, $total - array_sum(array_map(fn ($l) => $l['amount'] * $l['qty'], $lines))), 2, '.', '')],
                    ],
                ],
                'items' => collect($lines)->map(fn ($l) => [
                    'name' => $l['name'],
                    'quantity' => (string) $l['qty'],
                    'unit_amount' => ['currency_code' => strtoupper($currency), 'value' => number_format($l['amount'], 2, '.', '')],
                ])->values()->all(),
            ]],
            'payment_source' => [
                'paypal' => [
                    'experience_context' => [
                        'return_url' => $returnUrl,
                        'cancel_url' => $cancelUrl,
                    ],
                ],
            ],
        ])->throw();

        $id = $res->json('id');
        $approval = collect($res->json('links'))->firstWhere('rel', 'approve');

        return ['id' => $id, 'approval_url' => $approval['href'] ?? $returnUrl];
    }

    /** Capture an approved order. Returns the capture object (contains status + payer email). */
    public function captureOrder(string $paypalOrderId): array
    {
        if (config('services.paypal.mode') === 'mock') {
            return ['status' => 'COMPLETED', 'payer' => ['email_address' => 'buyer@demo.test']];
        }

        return $this->client()
            ->post("/v2/checkout/orders/{$paypalOrderId}/capture", [])
            ->throw()
            ->json();
    }

    /**
     * Verify a webhook. Real mode implements PayPal's transmission-signature
     * algorithm; mock mode accepts payloads that carry a matching webhook_token
     * header (demo only — never ship that check to production).
     */
    public function verifyWebhook(array $payload, array $headers): bool
    {
        if (config('services.paypal.mode') === 'mock') {
            $expected = config('services.paypal.webhook_token');
            return $expected !== null && hash_equals($expected, $headers['X-Lumen-Webhook-Token'] ?? '');
        }

        try {
            $transmissionId = $headers['Paypal-Transmission-Id'] ?? '';
            $transmissionTime = $headers['Paypal-Transmission-Time'] ?? '';
            $certUrl = $headers['Paypal-Cert-Url'] ?? '';
            $signature = $headers['Paypal-Transmission-Sig'] ?? '';
            $webhookId = config('services.paypal.webhook_id');

            $crc = crc32((string) json_encode($payload));
            $message = implode('|', [
                $transmissionId,
                $transmissionTime,
                $webhookId,
                $crc,
            ]);

            $cert = Http::get($certUrl)->body();
            $key = openssl_pkey_get_public($cert);
            if (! $key) {
                return false;
            }

            return openssl_verify($message, base64_decode($signature), $key, OPENSSL_ALGO_SHA256) === 1;
        } catch (\Throwable $e) {
            Log::warning('PayPal webhook verification failed', ['error' => $e->getMessage()]);

            return false;
        }
    }
}