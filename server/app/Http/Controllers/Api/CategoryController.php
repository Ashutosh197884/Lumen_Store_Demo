<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        return Category::query()
            ->when($request->boolean('withCounts'), fn ($q) => $q->withCount('products'))
            ->get();
    }
}
