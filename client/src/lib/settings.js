// ===== APP SETTINGS =====
// Single place to switch the whole app between demo (mock) and live (Laravel) mode.

export const BRAND = {
  name: 'Lumen',
  tagline: 'Modern essentials, delivered.',
}

export const CURRENCY = {
  code: 'USD',
  symbol: '$',
  // Stripe works in the smallest unit (cents). Keep prices in dollars in the UI/DB
  // and multiply by 100 only at the payment boundary.
  unit: 100,
}

export const API = {
  // false  → in-browser mock store (localStorage). Demo works with zero backend.
  // true   → real requests to the Laravel API (see server/docs/api.md).
  //         Client calls go to /api/* and Vite proxies them to Laravel in dev.
  USE_MOCK: true,
  BASE_URL: '/api',
  // Demo credentials for the admin panel (mock mode).
  DEMO_ADMIN: { email: 'admin@lumen.test', password: 'demo' },
  // Stripe test card that succeeds (mock mode accepts it; real mode uses Stripe test mode).
  TEST_CARD: '4242 4242 4242 4242',
  // Demo PayPal buyer (mock mode; real mode uses PayPal sandbox accounts).
  TEST_PAYPAL_EMAIL: 'buyer@demo.test',
}

export const STORE = {
  LOW_STOCK_THRESHOLD: 5,
  FREE_SHIPPING_OVER: 150,
  SHIPPING_FLAT: 5.99,
}
