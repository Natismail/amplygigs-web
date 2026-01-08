// src/hooks/useMarkMessagesRead.js - UPDATED VERSION
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to automatically mark messages as read when a conversation is opened
 * Usage: useMarkMessagesRead(conversationPartnerId);
 */
export function useMarkMessagesRead(conversationPartnerId) {
  const { user } = useAuth();
  const markedRef = useRef(false);

  useEffect(() => {
    if (!user || !conversationPartnerId) {
      console.log('⏸️ Mark as read skipped - missing user or conversationPartnerId');
      return;
    }

    // ⭐ Reset marked flag when conversation changes
    markedRef.current = false;

    const markMessagesAsRead = async () => {
      // ⭐ CRITICAL: Only mark once per conversation view
      if (markedRef.current) {
        console.log('✅ Already marked as read for this conversation');
        return;
      }

      try {
        console.log('📨 Marking messages as read from:', conversationPartnerId);
        
        const response = await fetch('/api/messages/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationPartnerId,
            userId: user.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Marked messages as read:', data.count || 0);
          
          // ⭐ CRITICAL: Mark as done
          markedRef.current = true;

          // ⭐ CRITICAL: Trigger event to refresh unread count
          window.dispatchEvent(new CustomEvent('messagesRead', {
            detail: { 
              userId: conversationPartnerId,
              count: data.count || 0
            }
          }));
        } else {
          console.error('❌ Failed to mark messages as read:', response.status);
        }
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    };

    // ⭐ Mark as read immediately when conversation opens
    const timeout = setTimeout(() => {
      markMessagesAsRead();
    }, 500); // Small delay to ensure messages are loaded

    return () => clearTimeout(timeout);
  }, [user, conversationPartnerId]);
}

/**
 * Function to mark a single message as read
 */
export async function markMessageAsRead(messageId, userId) {
  try {
    const response = await fetch('/api/messages/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, userId }),
    });

    if (response.ok) {
      // ⭐ Trigger event to refresh unread count
      window.dispatchEvent(new CustomEvent('messagesRead', {
        detail: { messageId, userId }
      }));
    }

    return response.ok;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
}

/**
 * Function to delete a message
 */
export async function deleteMessage(messageId, userId) {
  try {
    const response = await fetch(
      `/api/messages/mark-read?id=${messageId}&userId=${userId}`,
      { method: 'DELETE' }
    );

    return response.ok;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}