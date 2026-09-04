<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryLog;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    public function adjust(Request $request, Product $product)
    {
        $request->validate([
            'delta' => ['required', 'integer', 'not_in:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $delta = (int) $request->delta;

        if ($delta < 0 && ! $product->takeStock(abs($delta), $request->reason ?? 'manual removal', $request->user())) {
            throw ValidationException::withMessages([
                'delta' => ['Not enough stock on hand.'],
            ]);
        }

        if ($delta > 0) {
            $product->addStock($delta, $request->reason ?? 'manual restock', $request->user());
        }

        return $product->fresh();
    }

    public function logs(Request $request)
    {
        return ['data' => InventoryLog::query()
            ->with('product:id,name,slug')
            ->latest()
            ->paginate($request->integer('per_page', 50))];
    }
}
