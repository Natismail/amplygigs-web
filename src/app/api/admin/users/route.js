// src/app/api/admin/users/route.js - SIMPLIFIED FOR NEXT.JS 15/16
import { NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(request) {
  try {
    // Get request body
    const { userId, action, updates } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - No auth header' }, { status: 401 });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin status
    await verifyAdmin(user.id);

    // Perform action using admin client (bypasses RLS)
    let updateData = {};

    switch (action) {
      case 'verify':
        updateData = {
          is_verified: true,
          verification_status: 'verified'
        };
        break;

      case 'suspend':
        updateData = {
          is_suspended: true,
          verification_status: 'suspended',
          available: false,
          suspended_at: new Date().toISOString(),
          suspended_by: user.id
        };
        break;

      case 'activate':
        updateData = {
          is_suspended: false,
          verification_status: 'verified',
          available: true,
          suspended_at: null,
          suspended_by: null
        };
        break;

      case 'make_admin':
        updateData = {
          is_admin: true,
          role: 'ADMIN'
        };
        break;

      case 'remove_admin':
        updateData = {
          is_admin: false,
          role: 'MUSICIAN'
        };
        break;

      case 'custom':
        updateData = updates;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update user with admin client
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Admin update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log admin action
    await supabaseAdmin.from('admin_actions').insert({
      admin_id: user.id,
      action_type: action,
      target_user_id: userId,
      target_type: 'user_profile',
      target_id: userId,
      details: { action, updates: updateData },
      reason: `Admin ${action} action`
    });

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// GET route to fetch all users (admin only)
export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin status
    await verifyAdmin(user.id);

    // Fetch all users with admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}