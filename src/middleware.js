import { NextResponse } from 'next/server';

// Simple in-memory rate limiting
const requestCounts = new Map();

function checkRateLimit(ip, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || [];
  
  // Clean old requests
  const validRequests = userRequests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  requestCounts.set(ip, validRequests);
  return true;
}

export async function middleware(req) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const res = NextResponse.next();

  // ✅ FIXED: Different CSP for development vs production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const connectSources = [
    "'self'",
    "https://api.jamendo.com",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.paystack.co",
    "https://api.stripe.com",
    "https://nominatim.openstreetmap.org",
  ];

  // ✅ ADD: Allow localhost in development
  if (isDevelopment) {
    connectSources.push("http://localhost:8000");
    connectSources.push("http://127.0.0.1:8000");
  }

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://js.paystack.co https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      `connect-src ${connectSources.join(' ')}`, // ✅ FIXED: Use dynamic connect sources
      "media-src 'self' blob: data: https://*.supabase.co https://*.jamendo.com https://prod-1.storage.jamendo.com https://prod-2.storage.jamendo.com",
      "frame-src https://js.paystack.co https://js.stripe.com https://checkout.stripe.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // CSRF Protection
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    if (process.env.NODE_ENV === 'production' && origin && !origin.includes(host)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};




