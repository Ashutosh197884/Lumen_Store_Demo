# Lumen API — Laravel blueprint

The React client in `../client` talks to this API in production. **Mock mode is on by default**
(`src/lib/settings.js → API.USE_MOCK`), so you don't need this to demo. When you're ready to wire
the real backend:

```bash
# 1) Create a fresh Laravel project (Laravel 11/12 recommended)
composer create-project laravel/laravel api
cd api

# 2) Install the API tooling this blueprint uses
composer require laravel/sanctum stripe/stripe-php
php artisan install:api          # publishes Sanctum + routes/api.php

# 3) Copy this blueprint over the fresh install
cp -r ../lumen-store/server/app .          # Models + Http (adds Controllers/Api, Requests)
cp ../lumen-store/server/routes/api.php routes/api.php
cp -r ../lumen-store/server/database/* database/
cp ../lumen-store/server/phpunit-example OrderFlowTest.php tests/Feature/  # optional

# 4) Configure .env
#    DB_DATABASE=lumen   DB_USERNAME=root  DB_PASSWORD=…
#    STRIPE_KEY=pk_test_…   STRIPE_SECRET=sk_test_…   STRIPE_WEBHOOK_SECRET=whsec_…
#    FRONTEND_URL=http://localhost:5173

# 5) Create schema + seed demo catalogue + admin user
php artisan migrate --seed
php artisan serve              # API on http://127.0.0.1:8000

# 6) Point the client at it
#    client/src/lib/settings.js → API.USE_MOCK = false
#    (dev proxy in client/vite.config.js already forwards /api → 127.0.0.1:8000)
npm run dev                    # in ../client
```

Demo admin: `admin@lumen.test` / `demo` (created by `AdminUserSeeder`).

---

## What's in here

| Path | Contents |
|---|---|
| `database/migrations/` | Schema for all core tables (see below) |
| `database/seeders/` | Demo categories/products + admin user |
| `app/Models/` | Eloquent models matching the migrations |
| `app/Http/Controllers/Api/` | Resource controllers + Stripe/PayPal checkout & webhooks |
| `app/Http/Requests/` | Validation rules (authorization enforced in controllers) |
| `routes/api.php` | All endpoints, Sanctum-protected where admin-only |
| `docs/api.md` | Endpoint reference that mirrors `client/src/lib/api.js` |

### Core tables

`users` (admins; `role` column) · `categories` · `products` · `product_images` ·
`inventory_logs` · `customers` (guest checkouts, deduped by email) · `orders` · `order_items` ·
`payments`

> Deliberately omitted from v1 but easy to add later: `coupons`, `reviews`, `wishlists`,
> server-side `carts`. The client's cart context already handles guest carts today.

### Money

Prices are `decimal(10,2)` in the DB and displayed as-is in the client. Stripe needs the smallest
unit, so the `StripeService` multiplies by 100 (`CURRENCY.unit` in client settings mirrors this);
the `PayPalService` sends plain dollar strings to Orders v2.

### Order lifecycle

`created → paid → processing → shipped → delivered` (plus `cancelled`). Only the **payment
webhook** moves an order to `paid`; the admin panel moves it through fulfilment. The client's
tracking timeline renders from `order_events` JSON on the order.

### Security model (production checklist)

- All `/api/admin/*` (or `->middleware('auth:sanctum')` groups in `routes/api.php`) are
  admin-token-only. The SPA gate is UX sugar — **enforcement is here**.
- Rate limiting on `/api/auth/login`; passwords hashed; HTTPS enforced by the host.
- Card numbers never touch this server — Stripe Checkout is hosted; PayPal
  credentials stay on paypal.com.
