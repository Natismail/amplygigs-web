// src/lib/security/apiProtection.js - API ROUTE PROTECTION

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { rateLimiter } from './validation';

/**
 * Verify user is authenticated
 */
export async function requireAuth(request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      error: 'Unauthorized',
      status: 401,
    };
  }

  return { session };
}

/**
 * Verify user has specific role
 */
export async function requireRole(request, allowedRoles = []) {
  const { session, error } = await requireAuth(request);
  
  if (error) {
    return { error, status: 401 };
  }

  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_admin, is_support')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    return {
      error: 'Profile not found',
      status: 404,
    };
  }

  // Check if user has required role
  const hasRole = allowedRoles.includes(profile.role) || 
                  (allowedRoles.includes('ADMIN') && profile.is_admin) ||
                  (allowedRoles.includes('SUPPORT') && profile.is_support);

  if (!hasRole) {
    return {
      error: 'Forbidden',
      status: 403,
    };
  }

  return { session, profile };
}

/**
 * Rate limiting for API routes
 */
export function checkRateLimit(identifier, limit = 10, windowMs = 60000) {
  const allowed = rateLimiter.check(identifier, limit, windowMs);
  
  if (!allowed) {
    return {
      error: 'Too many requests',
      status: 429,
    };
  }

  return { allowed: true };
}

/**
 * Validate request origin (CSRF protection)
 */
export function validateOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    return { valid: true };
  }

  if (!origin || !origin.includes(host)) {
    return {
      error: 'Invalid origin',
      status: 403,
    };
  }

  return { valid: true };
}

/**
 * Complete API protection wrapper
 */
export async function protectAPIRoute(request, options = {}) {
  const {
    requireAuth: needsAuth = true,
    allowedRoles = [],
    rateLimit = { limit: 10, window: 60000 },
    validateCSRF = true,
  } = options;

  // 1. Validate origin (CSRF)
  if (validateCSRF) {
    const originCheck = validateOrigin(request);
    if (originCheck.error) {
      return originCheck;
    }
  }

  // 2. Check authentication
  if (needsAuth) {
    if (allowedRoles.length > 0) {
      const roleCheck = await requireRole(request, allowedRoles);
      if (roleCheck.error) {
        return roleCheck;
      }
      
      // 3. Rate limiting (per user)
      const rateLimitCheck = checkRateLimit(
        roleCheck.session.user.id,
        rateLimit.limit,
        rateLimit.window
      );
      
      if (rateLimitCheck.error) {
        return rateLimitCheck;
      }

      return roleCheck;
    } else {
      const authCheck = await requireAuth(request);
      if (authCheck.error) {
        return authCheck;
      }

      // 3. Rate limiting (per user)
      const rateLimitCheck = checkRateLimit(
        authCheck.session.user.id,
        rateLimit.limit,
        rateLimit.window
      );
      
      if (rateLimitCheck.error) {
        return rateLimitCheck;
      }

      return authCheck;
    }
  }

  // 4. Rate limiting (per IP for unauthenticated)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitCheck = checkRateLimit(ip, rateLimit.limit, rateLimit.window);
  
  if (rateLimitCheck.error) {
    return rateLimitCheck;
  }

  return { allowed: true };
}

/**
 * Example usage in API route:
 * 
 * export async function POST(request) {
 *   // Protect route: requires auth, musician role, rate limit 5 req/min
 *   const protection = await protectAPIRoute(request, {
 *     requireAuth: true,
 *     allowedRoles: ['MUSICIAN'],
 *     rateLimit: { limit: 5, window: 60000 },
 *   });
 * 
 *   if (protection.error) {
 *     return Response.json(
 *       { error: protection.error }, 
 *       { status: protection.status }
 *     );
 *   }
 * 
 *   // Your API logic here...
 *   const { session, profile } = protection;
 * }
 */
