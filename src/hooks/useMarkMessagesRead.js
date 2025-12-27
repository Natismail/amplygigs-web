// src/hooks/useMarkMessagesRead.js
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to automatically mark messages as read when a conversation is opened
 * Usage: useMarkMessagesRead(conversationPartnerId);
 */
export function useMarkMessagesRead(conversationPartnerId) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !conversationPartnerId) return;

    const markMessagesAsRead = async () => {
      try {
        await fetch('/api/messages/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationPartnerId,
            userId: user.id,
          }),
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    // Mark as read when conversation is opened
    markMessagesAsRead();

    // Optional: Mark as read periodically while conversation is open
    const interval = setInterval(markMessagesAsRead, 5000);

    return () => clearInterval(interval);
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