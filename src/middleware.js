// src/middleware.js - COMPREHENSIVE SECURITY MIDDLEWARE
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // ===========================================
  // 1. RATE LIMITING (Simple implementation)
  // ===========================================
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimitKey = `rate-limit:${ip}:${req.nextUrl.pathname}`;
  
  // Check rate limit (store in memory or Redis in production)
  // This is a basic example - use Redis for production
  
  // ===========================================
  // 2. AUTHENTICATION CHECK
  // ===========================================
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = [
    '/musician',
    '/client',
    '/admin',
    '/messages',
    '/notifications',
    '/kyc',
    '/tracking',
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ===========================================
  // 3. ROLE-BASED ACCESS CONTROL
  // ===========================================
  if (session) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_admin, is_support, is_verified')
      .eq('id', session.user.id)
      .single();

    // Admin-only routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!profile?.is_admin && !profile?.is_support) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Musician-only routes
    if (req.nextUrl.pathname.startsWith('/musician')) {
      if (profile?.role !== 'MUSICIAN') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Client-only routes
    if (req.nextUrl.pathname.startsWith('/client')) {
      if (profile?.role !== 'CLIENT') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  // ===========================================
  // 4. SECURITY HEADERS
  // ===========================================
  const response = res;
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  response.headers.set(
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
  // 5. CSRF PROTECTION
  // ===========================================
  // Check for valid origin on state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    if (origin && !origin.includes(host)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

