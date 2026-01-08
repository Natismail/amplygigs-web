// src/hooks/useMarkMessagesRead.js - FIXED VERSION
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

/**
 * Auto-marks messages as read when viewing a conversation
 * @param {string} otherUserId - The ID of the other user in the conversation
 */
export function useMarkMessagesRead(otherUserId) {
  const { user } = useAuth();
  const markedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!user?.id || !otherUserId) {
      console.log('⏸️ Mark as read skipped - missing user or otherUserId');
      return;
    }

    // Reset marked flag when conversation changes
    markedRef.current = false;

    const markAsRead = async () => {
      // ⭐ CRITICAL: Only mark once per conversation view
      if (markedRef.current) {
        console.log('✅ Already marked as read for this conversation');
        return;
      }

      try {
        console.log('📨 Marking messages as read from:', otherUserId);

        // ⭐ Mark all unread messages from this user as read
        const { data, error } = await supabase
          .from('messages')
          .update({ 
            read: true,
            read_at: new Date().toISOString()
          })
          .eq('receiver_id', user.id)
          .eq('sender_id', otherUserId)
          .eq('read', false);

        if (error) {
          console.error('❌ Error marking messages as read:', error);
          return;
        }

        console.log('✅ Messages marked as read:', data);
        markedRef.current = true;

        // ⭐ CRITICAL: Trigger unread count refresh
        // This ensures the sidebar and navbar update
        window.dispatchEvent(new CustomEvent('messagesRead', {
          detail: { userId: otherUserId }
        }));

      } catch (err) {
        console.error('❌ Exception marking messages as read:', err);
      }
    };

    // ⭐ Delay slightly to ensure messages are loaded first
    timeoutRef.current = setTimeout(() => {
      markAsRead();
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user?.id, otherUserId]);
}





// // src/hooks/useMarkMessagesRead.js
// import { useEffect } from 'react';
// import { useAuth } from '@/context/AuthContext';

// /**
//  * Hook to automatically mark messages as read when a conversation is opened
//  * Usage: useMarkMessagesRead(conversationPartnerId);
//  */
// export function useMarkMessagesRead(conversationPartnerId) {
//   const { user } = useAuth();

//   useEffect(() => {
//     if (!user || !conversationPartnerId) return;

//     const markMessagesAsRead = async () => {
//       try {
//         await fetch('/api/messages/mark-read', {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             conversationPartnerId,
//             userId: user.id,
//           }),
//         });
//       } catch (error) {
//         console.error('Error marking messages as read:', error);
//       }
//     };

//     // Mark as read when conversation is opened
//     markMessagesAsRead();

//     // Optional: Mark as read periodically while conversation is open
//     const interval = setInterval(markMessagesAsRead, 5000);

//     return () => clearInterval(interval);
//   }, [user, conversationPartnerId]);
// }


// /**
//  * Function to mark a single message as read
//  */
// export async function markMessageAsRead(messageId, userId) {
//   try {
//     const response = await fetch('/api/messages/mark-read', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ messageId, userId }),
//     });

//     return response.ok;
//   } catch (error) {
//     console.error('Error marking message as read:', error);
//     return false;
//   }
// }


// /**
//  * Function to delete a message
//  */
// export async function deleteMessage(messageId, userId) {
//   try {
//     const response = await fetch(
//       `/api/messages/mark-read?id=${messageId}&userId=${userId}`,
//       { method: 'DELETE' }
//     );

//     return response.ok;
//   } catch (error) {
//     console.error('Error deleting message:', error);
//     return false;
//   }
// }