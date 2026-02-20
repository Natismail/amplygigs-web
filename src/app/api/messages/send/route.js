// app/api/messages/send/route.js

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NotificationService, NotificationType } from '@/lib/notifications/NotificationService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { conversationId, senderId, recipientId, content, messageType = 'text', attachments = [] } = await request.json();
    
    // 1. Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        content,
        message_type: messageType,
        attachments: attachments,
        is_read: false,
      })
      .select(`
        *,
        sender:user_profiles!sender_id(
          id,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();
    
    if (error) throw error;
    
    // 2. Update conversation
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
    
    // 3. Send notification to recipient
    const senderName = message.sender.display_name || `${message.sender.first_name} ${message.sender.last_name}`;
    
    await NotificationService.send({
      userId: recipientId,
      type: NotificationType.MESSAGE_RECEIVED,
      title: `💬 New message from ${senderName}`,
      body: content.length > 100 ? `${content.substring(0, 100)}...` : content,
      priority: 'normal',
      relatedEntityType: 'message',
      relatedEntityId: message.id,
      actionUrl: '/messages',
      data: {
        conversationId,
        senderId,
        senderName,
        messagePreview: content.substring(0, 50),
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error.message 
    }, { status: 500 });
  }
}

// Mark messages as read
export async function PATCH(request) {
  try {
    const { messageIds, userId } = await request.json();
    
    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', messageIds)
      .eq('recipient_id', userId);
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true,
      markedAsRead: messageIds.length
    });
    
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json({ 
      error: 'Failed to mark messages as read',
      details: error.message 
    }, { status: 500 });
  }
}