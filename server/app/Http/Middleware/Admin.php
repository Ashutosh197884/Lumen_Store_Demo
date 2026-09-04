<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Admin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        return $next($request);
    }
}

// Laravel 11/12: register the alias in bootstrap/app.php
//
//   ->withMiddleware(function (Middleware $middleware) {
//       $middleware->alias(['admin' => \App\Http\Middleware\Admin::class]);
//   })
