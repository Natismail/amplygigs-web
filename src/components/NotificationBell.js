// src/components/NotificationBell.js
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
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ── Detect mobile ──────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Initial load & subscription ────────────
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const channel = subscribeToNotifications();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Close dropdown on outside click (desktop only) ──
  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  // ── Lock body scroll on mobile modal ──────
  useEffect(() => {
    document.body.style.overflow = (isMobile && isOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isOpen]);

  // ── Fetch ──────────────────────────────────
  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read && !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return null;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        if (Notification.permission === 'granted') {
          new Notification(payload.new.title, {
            body: payload.new.message,
            icon: '/icons/icon-192.png',
            tag: `notification-${payload.new.id}`,
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        if ((!payload.old.is_read && !payload.old.read) && (payload.new.is_read || payload.new.read)) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        if (!payload.old.is_read && !payload.old.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();
    return channel;
  };

  // ── Actions ────────────────────────────────
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const markAsRead = async (notificationId) => {
    const session = await getSession();
    if (!session) return;
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId
          ? { ...n, is_read: true, read: true, read_at: new Date().toISOString() }
          : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const session = await getSession();
    if (!session) return;
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    const session = await getSession();
    if (!session) return;
    try {
      await fetch(`/api/notifications/mark-read?id=${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read && !n.read);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // ── THE KEY FIX: handleNotificationClick ──
  // On mobile, router.push inside a touch handler was being swallowed
  // by the click-outside listener closing the modal first.
  // Solution: close AFTER navigation is queued, and use setTimeout to
  // let the event bubble fully settle before state changes.
  const handleNotificationClick = async (notification) => {
    // Mark as read first (non-blocking)
    if (!notification.is_read && !notification.read) {
      markAsRead(notification.id); // fire and forget
    }

    if (notification.action_url) {
      // On mobile: close modal then navigate
      // Use setTimeout so the touch event fully resolves before DOM changes
      setIsOpen(false);
      setTimeout(() => {
        router.push(notification.action_url);
      }, 50);
    } else {
      setIsOpen(false);
    }
  };

  const handleDeleteClick = (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  // ── Helpers ────────────────────────────────
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
      follow: '👥', like: '❤️', comment: '💬', share: '🔄',
      booking_confirmed: '✅', booking_created: '📅', booking_cancelled: '❌',
      payment_received: '💰', payment_released: '💸', message_received: '💬',
      job_application: '📋', proposal_received: '📨', event_interest: '👋',
      payment_success: '✅', job_posting_activated: '📢',
    };
    return icons[type] || '🔔';
  };

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.is_read && !n.read)
    : notifications;

  if (!user) return null;

  // ── Shared notification row ────────────────
  const NotificationRow = ({ notification, mobile = false }) => {
    const isUnread = !notification.is_read && !notification.read;

    return (
      <div
        className={`border-b border-gray-100 dark:border-gray-800 transition-colors
          ${isUnread ? 'bg-purple-50 dark:bg-purple-900/10' : 'bg-white dark:bg-gray-900'}
          ${notification.action_url ? 'cursor-pointer' : ''}
          active:bg-gray-100 dark:active:bg-gray-800
        `}
        // Use onPointerUp instead of onClick for reliable mobile touch
        onPointerUp={() => handleNotificationClick(notification)}
      >
        <div className={`p-4 flex items-start gap-3 ${mobile ? '' : ''}`}>
          {/* Icon */}
          <div className={`flex-shrink-0 ${mobile ? 'text-3xl' : 'text-2xl'}`}>
            {getIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-semibold text-gray-900 dark:text-white leading-snug
                ${mobile ? 'text-base' : 'text-sm line-clamp-1'}`}>
                {notification.title}
              </h4>

              {/* Delete button */}
              <button
                onPointerUp={(e) => handleDeleteClick(e, notification.id)}
                className={`flex-shrink-0 rounded-lg transition
                  hover:bg-red-100 dark:hover:bg-red-900/30
                  ${mobile ? 'p-2' : 'p-1 opacity-0 group-hover:opacity-100'}`}
                aria-label="Delete notification"
              >
                <Trash2 className={`text-red-500 ${mobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </button>
            </div>

            <p className={`text-gray-600 dark:text-gray-400 mt-0.5 leading-snug
              ${mobile ? 'text-sm' : 'text-xs line-clamp-2'}`}>
              {notification.message}
            </p>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-gray-400">{getTimeAgo(notification.created_at)}</span>

              {isUnread && (
                <>
                  <span className="text-xs text-gray-300">•</span>
                  <button
                    onPointerUp={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="text-xs text-purple-600 font-medium flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark as read
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Unread dot */}
          {isUnread && (
            <div className={`flex-shrink-0 bg-purple-600 rounded-full mt-1
              ${mobile ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
          )}
        </div>
      </div>
    );
  };

  // ── Shared header content ──────────────────
  const HeaderContent = ({ mobile = false }) => (
    <>
      <div className={`flex items-center justify-between ${mobile ? 'mb-4' : 'mb-3'}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white ${mobile ? 'text-xl' : 'text-lg'}`}>
          Notifications
        </h3>
        <button
          onPointerUp={() => setIsOpen(false)}
          className={`hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition
            ${mobile ? 'p-2' : 'p-1.5'}`}
        >
          <X className={mobile ? 'w-6 h-6' : 'w-5 h-5'} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {['all', 'unread'].map((tab) => (
          <button
            key={tab}
            onPointerUp={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition capitalize
              ${mobile ? 'py-2.5' : ''}
              ${activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
          >
            {tab === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {unreadCount > 0 && (
        <button
          onPointerUp={markAllAsRead}
          className={`w-full text-sm font-medium text-purple-600
            hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition
            flex items-center justify-center gap-2 ${mobile ? 'py-2.5' : 'py-2'}`}
        >
          <CheckCheck className={mobile ? 'w-5 h-5' : 'w-4 h-4'} />
          Mark all as read
        </button>
      )}
    </>
  );

  const EmptyState = ({ mobile = false }) => (
    <div className={`flex flex-col items-center justify-center text-center
      ${mobile ? 'py-20' : 'py-12'}`}>
      <Bell className={`text-gray-300 mb-3 ${mobile ? 'w-16 h-16' : 'w-12 h-12'}`} />
      <p className="text-gray-500">
        {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
      </p>
    </div>
  );

  // ── Render ─────────────────────────────────
  return (
    <>
      {/* Bell button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onPointerUp={() => setIsOpen(prev => !prev)}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition
            min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold
              rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* ── Desktop dropdown ──────────────── */}
        {isOpen && !isMobile && (
          <div
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl
              shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <HeaderContent />
            </div>

            <div className="max-h-[28rem] overflow-y-auto">
              {loading ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredNotifications.map(n => (
                    <div key={n.id} className="group">
                      <NotificationRow notification={n} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onPointerUp={() => { router.push('/notifications'); setIsOpen(false); }}
                  className="w-full text-sm text-purple-600 font-medium py-1"
                >
                  View all notifications →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile full-screen modal ──────────── */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col"
          // Prevent touch events from bubbling to elements behind
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <HeaderContent mobile />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full" />
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <EmptyState mobile />
            ) : (
              filteredNotifications.map(n => (
                <NotificationRow key={n.id} notification={n} mobile />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onPointerUp={() => { router.push('/notifications'); setIsOpen(false); }}
                className="w-full py-3 text-base text-purple-600 font-semibold"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}