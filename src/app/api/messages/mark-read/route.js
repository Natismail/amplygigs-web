// src/app/api/messages/mark-read/route.js - UPDATED VERSION
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { messageId, userId } = await req.json();

    if (!messageId || !userId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ⭐ CRITICAL: Mark single message as read (update BOTH fields)
    const { error } = await supabase
      .from('messages')
      .update({ 
        read: true,        // ⭐ Primary read field
        is_read: true,     // ⭐ Compatibility field
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('receiver_id', userId);

    if (error) {
      console.error('❌ Error marking message as read:', error);
      return Response.json(
        { error: 'Failed to mark message as read' },
        { status: 500 }
      );
    }

    console.log('✅ Message marked as read:', messageId);
    return Response.json({ success: true });

  } catch (error) {
    console.error('❌ Mark message as read error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ⭐ Mark all messages in a conversation as read
export async function PUT(req) {
  try {
    const { conversationPartnerId, userId } = await req.json();

    if (!conversationPartnerId || !userId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📨 Marking all messages as read:', { conversationPartnerId, userId });

    // ⭐ CRITICAL: Mark all unread messages from partner (update BOTH fields)
    const { data, error } = await supabase
      .from('messages')
      .update({ 
        read: true,        // ⭐ Primary read field
        is_read: true,     // ⭐ Compatibility field
        read_at: new Date().toISOString()
      })
      .eq('sender_id', conversationPartnerId)
      .eq('receiver_id', userId)
      .eq('read', false)  // Only unread messages
      .select();          // ⭐ Return updated rows

    if (error) {
      console.error('❌ Error marking conversation as read:', error);
      return Response.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }

    console.log('✅ Marked messages as read:', data?.length || 0);
    
    // ⭐ CRITICAL: Trigger event to refresh unread count
    return Response.json({ 
      success: true,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('❌ Mark conversation as read error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a message
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!messageId || !userId) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // User can delete messages they sent or received
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
      console.error('❌ Error deleting message:', error);
      return Response.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      );
    }

    console.log('✅ Message deleted:', messageId);
    return Response.json({ success: true });

  } catch (error) {
    console.error('❌ Delete message error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}