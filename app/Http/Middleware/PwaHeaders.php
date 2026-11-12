<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Header untuk file PWA yang diserve Laravel (FrankenPHP di Vercel).
 * Hanya berlaku untuk manifest, service worker, offline, dan ikon.
 */
class PwaHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $path = $request->path();

        if ($path === 'manifest.webmanifest') {
            $response->headers->set('Content-Type', 'application/manifest+json');
            $response->headers->set('Cache-Control', 'public, max-age=3600');
        } elseif ($path === 'sw.js') {
            $response->headers->set('Content-Type', 'application/javascript');
            $response->headers->set('Cache-Control', 'no-cache, must-revalidate');
            $response->headers->set('Service-Worker-Allowed', '/');
        } elseif ($path === 'offline.html') {
            $response->headers->set('Cache-Control', 'no-cache');
        }

        return $response;
    }
}
