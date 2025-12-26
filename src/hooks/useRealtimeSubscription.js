// src/hooks/useRealtimeSubscription.js
"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Universal real-time subscription hook
 * Automatically handles subscriptions with proper cleanup
 */
export function useRealtimeSubscription({
  table,
  filter,
  event = '*', // INSERT, UPDATE, DELETE, or '*' for all
  onInsert,
  onUpdate,
  onDelete,
  onChange, // Called for any change
  enabled = true,
}) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    console.log(`🔔 Subscribing to ${table}`, filter);

    // Create unique channel name
    const channelName = `realtime:${table}:${filter ? JSON.stringify(filter) : 'all'}`;

    // Create channel
    const channel = supabase.channel(channelName);

    // Build filter string for Supabase
    let filterString = '';
    if (filter) {
      const entries = Object.entries(filter);
      if (entries.length > 0) {
        filterString = entries
          .map(([key, value]) => `${key}=eq.${value}`)
          .join(',');
      }
    }

    // Subscribe to changes
    const config = {
      event,
      schema: 'public',
      table,
    };

    if (filterString) {
      config.filter = filterString;
    }

    channel.on('postgres_changes', config, (payload) => {
      console.log(`✨ Real-time update on ${table}:`, payload);

      // Call specific handlers
      if (payload.eventType === 'INSERT' && onInsert) {
        onInsert(payload.new);
      }
      if (payload.eventType === 'UPDATE' && onUpdate) {
        onUpdate(payload.new, payload.old);
      }
      if (payload.eventType === 'DELETE' && onDelete) {
        onDelete(payload.old);
      }

      // Call generic change handler
      if (onChange) {
        onChange(payload);
      }
    });

    // Subscribe
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to ${table}`);
      }
      if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Subscription error for ${table}`);
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log(`🔌 Unsubscribing from ${table}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, JSON.stringify(filter), event, enabled]);

  return channelRef;
}

/**
 * Hook for following real-time updates
 */
export function useFollowersRealtime(userId, onUpdate) {
  useRealtimeSubscription({
    table: 'user_follows',
    filter: { following_id: userId },
    onChange: () => {
      console.log('👥 Follower count changed');
      if (onUpdate) onUpdate();
    },
    enabled: !!userId,
  });

  useRealtimeSubscription({
    table: 'user_follows',
    filter: { follower_id: userId },
    onChange: () => {
      console.log('👤 Following count changed');
      if (onUpdate) onUpdate();
    },
    enabled: !!userId,
  });
}

/**
 * Hook for messages real-time updates
 */
export function useMessagesRealtime(userId, onNewMessage) {
  useRealtimeSubscription({
    table: 'messages',
    filter: { receiver_id: userId },
    event: 'INSERT',
    onInsert: (message) => {
      console.log('💬 New message received:', message);
      if (onNewMessage) onNewMessage(message);
    },
    enabled: !!userId,
  });
}

/**
 * Hook for notifications real-time updates
 */
export function useNotificationsRealtime(userId, onNewNotification) {
  useRealtimeSubscription({
    table: 'notifications',
    filter: { user_id: userId },
    event: 'INSERT',
    onInsert: (notification) => {
      console.log('🔔 New notification:', notification);
      if (onNewNotification) onNewNotification(notification);
      
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/icon-192.png',
        });
      }
    },
    enabled: !!userId,
  });
}

/**
 * Hook for bookings real-time updates
 */
export function useBookingsRealtime(userId, onUpdate) {
  useRealtimeSubscription({
    table: 'bookings',
    filter: { musician_id: userId },
    onChange: () => {
      console.log('📅 Booking updated');
      if (onUpdate) onUpdate();
    },
    enabled: !!userId,
  });

  useRealtimeSubscription({
    table: 'bookings',
    filter: { client_id: userId },
    onChange: () => {
      console.log('📅 Booking updated');
      if (onUpdate) onUpdate();
    },
    enabled: !!userId,
  });
}