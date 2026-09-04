<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PayPalWebhookController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\StripeWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public — storefront + guest order tracking + Stripe
|--------------------------------------------------------------------------
*/

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);

// Guests track orders by reference (shown on the confirmation page/email)
Route::get('/orders/{ref}', [OrderController::class, 'show']);

// POST /checkout → hosted payment session → { checkout_url } (Stripe) or
// { approval_url } (PayPal), depending on payment_method.
// The webhooks below are called by the providers (never the browser) to
// confirm payment; they must not be CSRF-protected.
Route::post('/checkout', [CheckoutController::class, 'session']);
Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle'])
    ->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class);
Route::post('/webhooks/paypal', [PayPalWebhookController::class, 'handle'])
    ->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class);

/*
|--------------------------------------------------------------------------
| Auth — Sanctum
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
});

/*
|--------------------------------------------------------------------------
| Admin — Sanctum token + admin role (enforced in app/Http/Middleware/Admin.php)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    // Products — full CRUD powers the no-code admin panel
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    // Inventory
    Route::post('/inventory/{product}/adjust', [InventoryController::class, 'adjust']);
    Route::get('/inventory/logs', [InventoryController::class, 'logs']);

    // Orders, customers, stats
    Route::get('/orders', [OrderController::class, 'index']);
    Route::patch('/orders/{ref}/status', [OrderController::class, 'updateStatus']);
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/stats/overview', [StatsController::class, 'overview']);
});
