// src/app/api/notifications/mark-read/route.js - FIXED VERSION
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin client for operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ⭐ Mark single notification as read
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create client with user's token for auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Missing notificationId' },
        { status: 400 }
      );
    }

    console.log('📧 Marking notification as read:', { notificationId, userId: user.id });

    // ⭐ CRITICAL: Update BOTH read fields for compatibility
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,     // ⭐ Primary field
        read: true,        // ⭐ Compatibility field
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error marking notification as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notification as read', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Notification marked as read:', data);
    return NextResponse.json({ success: true, notification: data });

  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ⭐ Mark all notifications as read
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('📧 Marking all notifications as read for user:', user.id);

    // ⭐ CRITICAL: Update BOTH read fields for compatibility
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,     // ⭐ Primary field
        read: true,        // ⭐ Compatibility field
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .or('is_read.eq.false,read.eq.false')  // ⭐ Check BOTH fields
      .select();

    if (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Marked all notifications as read:', data?.length || 0);

    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      notifications: data 
    });

  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ⭐ Delete a notification
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Missing notification id' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting notification:', { notificationId, userId: user.id });

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error deleting notification:', error);
      return NextResponse.json(
        { error: 'Failed to delete notification', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Notification deleted');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Delete notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}