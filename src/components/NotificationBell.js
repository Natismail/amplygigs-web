// src/components/social/NotificationBell.js - FIXED VERSION
"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef(null);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
      
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('📧 Fetching notifications for user:', user.id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      console.log('✅ Fetched notifications:', data?.length || 0);
      setNotifications(data || []);
      
      // ⭐ Count unread using BOTH fields for compatibility
      const unread = (data || []).filter(n => !n.is_read && !n.read).length;
      console.log('📊 Unread count:', unread);
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return null;

    console.log('🔔 Subscribing to notifications for user:', user.id);

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New notification:', payload.new);
          
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/icons/icon-192.png',
              tag: `notification-${payload.new.id}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Notification updated:', payload.new);
          
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          );
          
          // Recalculate unread count
          const wasUnread = !payload.old.is_read && !payload.old.read;
          const isNowRead = payload.new.is_read || payload.new.read;
          
          if (wasUnread && isNowRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Notification deleted:', payload.old);
          
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          
          // Decrease unread count if deleted notification was unread
          if (!payload.old.is_read && !payload.old.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return channel;
  };

  const markAsRead = async (notificationId) => {
    try {
      console.log('📧 Marking notification as read:', notificationId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session');
        return;
      }

      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as read');
      }

      const result = await response.json();
      console.log('✅ Notification marked as read:', result);

      // Update local state
      setNotifications(prev =>
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      alert('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('📧 Marking all notifications as read');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session');
        return;
      }

      const response = await fetch('/api/notifications/mark-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark all as read');
      }

      const result = await response.json();
      console.log('✅ All notifications marked as read:', result);

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read: true, read_at: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      alert('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      console.log('🗑️ Deleting notification:', notificationId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session');
        return;
      }

      const response = await fetch(`/api/notifications/mark-read?id=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete notification');
      }

      console.log('✅ Notification deleted');

      // Update local state
      const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read && !n.read);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      alert('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read && !notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate if has action URL
    if (notification.action_url) {
      router.push(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getIcon = (type) => {
    const icons = {
      'follow': '👥',
      'like': '❤️',
      'comment': '💬',
      'share': '🔄',
      'booking_confirmed': '✅',
      'booking_created': '📅',
      'booking_cancelled': '❌',
      'payment_received': '💰',
      'payment_released': '💸',
      'message_received': '💬',
      'job_application': '📋',
      'proposal_received': '📨',
      'event_interest': '👋',
    };
    return icons[type] || '🔔';
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.is_read && !n.read)
    : notifications;

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Notifications"
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  activeTab === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  activeTab === 'unread'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="w-full mt-3 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition flex items-center justify-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[32rem] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => {
                  const isUnread = !notification.is_read && !notification.read;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`relative group ${
                        isUnread
                          ? 'bg-purple-50 dark:bg-purple-900/10' 
                          : 'bg-white dark:bg-gray-800'
                      } hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer`}
                    >
                      <div
                        onClick={() => handleNotificationClick(notification)}
                        className="p-4"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 text-2xl mt-1">
                            {getIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                                {notification.title}
                              </h4>
                              
                              {/* Delete Button */}
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {getTimeAgo(notification.created_at)}
                              </span>

                              {isUnread && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Unread Indicator */}
                          {isUnread && (
                            <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => {
                  router.push('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}