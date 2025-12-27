// src/app/api/notifications/mark-read/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { notificationId, userId } = await req.json();

    if (!notificationId || !userId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mark single notification as read
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId); // Security: ensure user owns the notification

    if (error) {
      console.error('Error marking notification as read:', error);
      return Response.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark all notifications as read for a user
export async function PUT(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false); // Only update unread ones

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return Response.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a notification
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!notificationId || !userId) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId); // Security: ensure user owns the notification

    if (error) {
      console.error('Error deleting notification:', error);
      return Response.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Delete notification error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}