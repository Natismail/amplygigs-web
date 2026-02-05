// src/middleware/adminAuth.js
// ADMIN AUTHENTICATION MIDDLEWARE

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify user is an admin
 */
export async function verifyAdmin(userId) {
  try {
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('id, role, first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return { isAdmin: false, error: 'User not found' };
    }

    if (user.role !== 'ADMIN') {
      return { isAdmin: false, error: 'Unauthorized - Admin access required' };
    }

    return { isAdmin: true, user };
  } catch (error) {
    return { isAdmin: false, error: error.message };
  }
}

/**
 * Check if admin has specific permission
 */
export async function checkAdminPermission(userId, permission) {
  try {
    const { data, error } = await supabase
      .rpc('has_admin_permission', {
        p_admin_id: userId,
        p_permission: permission
      });

    if (error) {
      console.error('Permission check error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(params) {
  try {
    const {
      adminId,
      action,
      resourceType,
      resourceId = null,
      details = {},
      status = 'success',
      errorMessage = null
    } = params;

    const { data, error } = await supabase
      .rpc('log_admin_action', {
        p_admin_id: adminId,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details,
        p_status: status,
        p_error_message: errorMessage
      });

    if (error) {
      console.error('Audit log error:', error);
    }

    return data;
  } catch (error) {
    console.error('Audit log error:', error);
    return null;
  }
}

/**
 * Middleware function for admin routes
 */
export async function requireAdmin(req, requiredPermission = null) {
  try {
    // Get user ID from request (you'll need to adapt this based on your auth setup)
    const userId = req.headers.get('x-user-id'); // Or get from session/JWT

    if (!userId) {
      return {
        authorized: false,
        error: 'Authentication required',
        status: 401
      };
    }

    // Verify admin status
    const { isAdmin, user, error } = await verifyAdmin(userId);

    if (!isAdmin) {
      return {
        authorized: false,
        error: error || 'Unauthorized',
        status: 403
      };
    }

    // Check specific permission if required
    if (requiredPermission) {
      const hasPermission = await checkAdminPermission(userId, requiredPermission);
      
      if (!hasPermission) {
        return {
          authorized: false,
          error: `Missing required permission: ${requiredPermission}`,
          status: 403
        };
      }
    }

    return {
      authorized: true,
      user
    };
  } catch (error) {
    return {
      authorized: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * Helper to get admin from auth header
 */
export async function getAdminFromRequest(req) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    const { isAdmin, user: adminUser } = await verifyAdmin(user.id);
    
    if (!isAdmin) {
      return null;
    }

    return adminUser;
  } catch (error) {
    console.error('Get admin error:', error);
    return null;
  }
}

/**
 * Permission constants
 */
export const ADMIN_PERMISSIONS = {
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  VIEW_BOOKINGS: 'view_bookings',
  MANAGE_BOOKINGS: 'manage_bookings',
  VIEW_FINANCIALS: 'view_financials',
  MANAGE_FINANCIALS: 'manage_financials',
  RELEASE_FUNDS: 'release_funds',
  MANAGE_DISPUTES: 'manage_disputes',
  VIEW_COMPLIANCE: 'view_compliance',
  MANAGE_COMPLIANCE: 'manage_compliance',
  APPROVE_WITHDRAWALS: 'approve_withdrawals',
  MANAGE_SETTINGS: 'manage_settings',
  SUPER_ADMIN: 'super_admin'
};