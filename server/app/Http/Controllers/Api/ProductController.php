<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->with('category:id,slug,name,gradient')
            ->when($request->filled('category') && $request->category !== 'all', fn ($q) => $q->whereHas('category', fn ($c) => $c->where('slug', $request->category)))
            ->when($request->filled('q'), function ($q) use ($request) {
                $s = '%'.$request->q.'%';
                $q->where(fn ($w) => $w->where('name', 'like', $s)->orWhere('sku', 'like', $s));
            })
            // Admins may pass includeInactive=true (admin panel shows hidden products)
            ->when(! $request->boolean('includeInactive'), fn ($q) => $q->live());

        // Sort key matches the client sort select
        match ($request->sort ?? 'featured') {
            'price-asc' => $query->orderBy('price'),
            'price-desc' => $query->orderByDesc('price'),
            'rating' => $query->orderByDesc('rating')->orderByDesc('review_count'),
            'newest' => $query->orderByDesc('created_at'),
            default => $query->orderByDesc('featured')->orderByDesc('stock')->orderByDesc('created_at'),
        };

        return ['data' => $query->paginate($request->integer('per_page', 100))->withQueryString()];
    }

    public function show(Request $request, Product $product)
    {
        abort_unless($product->active || $request->user()?->isAdmin(), 404);

        $product->load('category:id,slug,name,gradient', 'images');

        return $product;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'exists:categories,slug'],
            'price' => ['required', 'numeric', 'min:0'],
            'compareAt' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'sku' => ['nullable', 'string', 'max:64'],
            'unit' => ['nullable', 'string', 'max:32'],
            'art' => ['nullable', 'string', 'max:16'],
            'description' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string'],
            'badges' => ['nullable', 'array'],
            'badges.*' => ['string'],
            'active' => ['boolean'],
        ]);

        $product = Product::create([
            ...$data,
            'category_id' => \App\Models\Category::where('slug', $data['category'])->value('id'),
            'slug' => $this->uniqueSlug($data['name']),
            'compare_at_price' => $data['compareAt'] ?? null,
            'art' => $data['art'] ?? null,
            'low_stock_threshold' => 5,
        ]);

        return response()->json($product->load('category'), 201);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'exists:categories,slug'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'compareAt' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'sku' => ['nullable', 'string', 'max:64'],
            'unit' => ['nullable', 'string', 'max:32'],
            'art' => ['nullable', 'string', 'max:16'],
            'description' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'badges' => ['nullable', 'array'],
            'active' => ['sometimes', 'boolean'],
        ]);

        // Keep the client's camelCase payload in sync with DB snake_case columns.
        $product->fill([
            'name' => $data['name'] ?? $product->name,
            'category_id' => isset($data['category'])
                ? \App\Models\Category::where('slug', $data['category'])->value('id')
                : $product->category_id,
            'price' => $data['price'] ?? $product->price,
            'compare_at_price' => array_key_exists('compareAt', $data) ? ($data['compareAt'] ?? null) : $product->compare_at_price,
            'stock' => $data['stock'] ?? $product->stock,
            'sku' => $data['sku'] ?? $product->sku,
            'unit' => $data['unit'] ?? $product->unit,
            'art' => $data['art'] ?? $product->art,
            'description' => array_key_exists('description', $data) ? $data['description'] : $product->description,
            'features' => $data['features'] ?? $product->features,
            'badges' => $data['badges'] ?? $product->badges,
            'active' => $data['active'] ?? $product->active,
        ]);
        $product->save();

        return $product->load('category');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted.']);
    }

    private function uniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $base = $slug;
        $n = 2;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
