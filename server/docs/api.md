# Lumen API reference

Base URL (dev): `http://127.0.0.1:8000/api` — the Vite dev server proxies `/api` there.
All payloads are JSON. Money is `decimal(10,2)` on the wire (Stripe converts to cents).

| Method & path | Purpose | Auth |
|---|---|---|
| `GET /products` | Catalogue. Query: `category`, `q`, `sort` (`featured\|price-asc\|price-desc\|rating\|newest`), `includeInactive=true` (admin), `per_page` | public |
| `GET /products/{slug}` | Product detail (404 if hidden unless admin) | public |
| `GET /categories` | Category list, `?withCounts=1` | public |
| `GET /orders/{ref}` | Tracking timeline (`?email=` required unless admin) | public* |
| `POST /checkout` | Validate + price order server-side, create order, open Stripe Checkout or PayPal approval (`payment_method: stripe\|paypal`) → `{checkout_url\|approval_url, order_ref}` | public |
| `POST /webhooks/stripe` | Payment confirmation → order `paid`, stock decrement | Stripe signature |
| `POST /webhooks/paypal` | Approval capture + payment confirmation → order `paid`, stock decrement | PayPal signature |
| `POST /auth/login` | Sanctum token for admins (10/min rate limit) | public |
| `POST /auth/logout` / `GET /auth/me` | Session management | token |
| `POST /products` | Create product (admin panel) | token + admin |
| `PUT /products/{slug}` | Update product | token + admin |
| `DELETE /products/{slug}` | Delete product | token + admin |
| `POST /inventory/{slug}/adjust` | `{delta: int, reason?}` stock change, audited | token + admin |
| `GET /inventory/logs` | Stock movement audit trail | token + admin |
| `GET /orders` | List orders (`?status=`) | token + admin |
| `PATCH /orders/{ref}/status` | Lifecycle move (`paid…delivered\|cancelled`) | token + admin |
| `GET /customers` | Customers + spend aggregates (`?q=`) | token + admin |
| `GET /stats/overview` | Dashboard KPIs, 7-day revenue, low stock, recent orders | token + admin |

`*` Guest order tracking is email-gated — never expose order details by ref alone.

## Auth flow (client)

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@lumen.test","password":"demo"}'
# → { "user": {…, "role":"admin"}, "token": "1|abc…" }

curl http://127.0.0.1:8000/api/orders \
  -H "Authorization: Bearer 1|abc…"
```

Client stores the token as `lumen.token` and the axios interceptor in
`client/src/lib/http.js` attaches it automatically. The `admin` route group is enforced by
`app/Http/Middleware/Admin.php` (register the alias in `bootstrap/app.php`).

## Stripe (test mode)

```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

```php
// config/services.php
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
],
```

Demo test purchase (mirrors the mock): run the client, add any product, and in Stripe's test
checkout use `4242 4242 4242 4242`, any future expiry, any CVC. The order becomes `paid` only when
the `checkout.session.completed` webhook lands.

Local webhook testing:

```bash
stripe listen --forward-to http://127.0.0.1:8000/api/webhooks/stripe
```

## PayPal (sandbox)

```env
PAYPAL_MODE=sandbox          # sandbox | live | mock (mock needs no credentials)
PAYPAL_CLIENT_ID=Abc...
PAYPAL_SECRET=Elf...
PAYPAL_WEBHOOK_ID=xxx       # real signature verification (sandbox/live)
PAYPAL_WEBHOOK_TOKEN=demo   # shared secret accepted ONLY in mock mode
```

```php
// config/services.php
'paypal' => [
    'mode' => env('PAYPAL_MODE', 'mock'),
    'client_id' => env('PAYPAL_CLIENT_ID'),
    'secret' => env('PAYPAL_SECRET'),
    'webhook_id' => env('PAYPAL_WEBHOOK_ID'),
    'webhook_token' => env('PAYPAL_WEBHOOK_TOKEN'),
],
```

Demo test purchase: pick PayPal at checkout → the API creates an Orders v2 approval
(`{approval_url}`) → buyer approves on paypal.com → `CHECKOUT.ORDER.APPROVED` triggers the
capture and `PAYMENT.CAPTURE.COMPLETED` marks the order `paid` and decrements stock — never
before. Set up a sandbox app at developer.paypal.com, then:

```bash
# PayPal's webhook simulator needs a public URL; for local dev use ngrok + the
# dashboard's "Simulate webhook" tool pointing at /api/webhooks/paypal.
```

In `mock` mode the service returns a placeholder approval URL and skips network calls, so
credentials aren't needed to walk the flow in a demo — flip to `sandbox` for a real capture.

## Client ⇄ server field mapping

The client (mock mode) already speaks this contract. When you flip `API.USE_MOCK = false`:

| Client (mock) | Server |
|---|---|
| `product.id` (slug) | `products.slug` |
| `product.category` (slug) | `products.category_id` → categories.slug |
| `price` / `compareAt` | `price` / `compare_at_price` |
| `order.ref`, `order.status`, `order.events` | `orders.ref`, `status`, `events` |
| `customer` object | `orders.shipping_*` columns + `customers` row |

Products returned by the API include `category: {slug, name, gradient}` — the client's
`GradientTile` uses that to pick tile art. Real product photos replace `art` via the
`product_images` table (the form's emoji picker is the placeholder until upload is wired).
