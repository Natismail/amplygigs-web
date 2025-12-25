// src/middleware.js - FIXED FOR ROUTE GROUPS
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();

  // ===========================================
  // 1. SECURITY HEADERS (Always apply)
  // ===========================================
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
    "frame-ancestors 'none';"
  );

  // ===========================================
  // 2. CSRF PROTECTION (State-changing requests)
  // ===========================================
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    if (process.env.NODE_ENV === 'production' && origin && !origin.includes(host)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // ===========================================
  // 3. NO AUTH CHECKS YET
  // ===========================================
  // Since your app uses (app) route groups and handles auth in pages,
  // we'll just apply security headers for now.
  // Auth checks are handled by your AuthContext and page-level logic.

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};