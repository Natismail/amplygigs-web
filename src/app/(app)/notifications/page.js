// app/notifications/page.js - FIXED: Opens settings modal
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Search,
  X,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import NotificationPreferences from '@/components/settings/NotificationPreferences'; // ⭐ Import component

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSettings, setShowSettings] = useState(false); // ⭐ NEW: Modal state

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'booking', label: 'Bookings' },
    { value: 'message', label: 'Messages' },
    { value: 'payment', label: 'Payments' },
    { value: 'job', label: 'Job Applications' },
    { value: 'rating', label: 'Ratings' },
    { value: 'proposal', label: 'Proposals' },
    { value: 'event', label: 'Events' },
  ];

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [notifications, filter, typeFilter, searchQuery]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('📧 Fetching notifications for user:', user.id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        throw error;
      }

      console.log('✅ Fetched notifications:', data?.length || 0);
      setNotifications(data || []);
    } catch (error) {
      console.error('❌ Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;

    console.log('🔔 Subscribing to notifications');

    const subscription = supabase
      .channel(`notifications-page-${user.id}`)
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
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read && !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.is_read || n.read);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type?.includes(typeFilter));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationIds) => {
    try {
      console.log('📧 Marking notifications as read:', notificationIds);

      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read: true,
          read_at: new Date().toISOString() 
        })
        .in('id', notificationIds);

      if (error) throw error;

      console.log('✅ Marked as read');

      setNotifications(prev =>
        prev.map(n => notificationIds.includes(n.id) 
          ? { ...n, is_read: true, read: true, read_at: new Date().toISOString() } 
          : n
        )
      );
      setSelectedIds([]);
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      alert('Failed to mark notifications as read');
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.is_read && !n.read)
      .map(n => n.id);

    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const deleteNotifications = async (notificationIds) => {
    try {
      console.log('🗑️ Deleting notifications:', notificationIds);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) throw error;

      console.log('✅ Deleted');

      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error('❌ Error deleting:', error);
      alert('Failed to delete notifications');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read && !notification.read) {
      await markAsRead([notification.id]);
    }

    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getIcon = (type) => {
    const icons = {
      'booking_confirmed': '✅',
      'booking_created': '📅',
      'booking_cancelled': '❌',
      'payment_received': '💰',
      'payment_released': '💸',
      'message_received': '💬',
      'job_application': '📋',
      'proposal_received': '📨',
      'event_interest': '👋',
      'follow': '👥',
      'like': '❤️',
      'comment': '💬',
      'share': '🔄',
    };
    return icons[type] || '🔔';
  };

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Please log in to view notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Bell className="w-7 h-7" />
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>

            {/* ⭐ FIXED: Opens modal instead of navigating */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Preference</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {['all', 'unread', 'read'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      filter === f
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedIds.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => markAsRead(selectedIds)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition text-sm"
                >
                  <Check className="w-4 h-4" />
                  Mark as read
                </button>
                <button
                  onClick={() => deleteNotifications(selectedIds)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          {filteredNotifications.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              {selectedIds.length === filteredNotifications.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
          {unreadCount > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <button
                onClick={markAllAsRead}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            </>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full" />
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery 
                  ? 'No notifications match your search'
                  : filter === 'unread'
                  ? 'All caught up! No unread notifications'
                  : 'You don\'t have any notifications yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const isUnread = !notification.is_read && !notification.read;

              return (
                <div
                  key={notification.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl border ${
                    isUnread
                      ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  } hover:shadow-md transition group overflow-hidden`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => toggleSelect(notification.id)}
                        className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Icon */}
                      <div className="flex-shrink-0 text-3xl mt-0.5">
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                            {getTimeAgo(notification.created_at)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-3">
                          {isUnread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead([notification.id]);
                              }}
                              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Mark as read
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotifications([notification.id]);
                            }}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
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

      {/* ⭐ SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Settings className="w-7 h-7" />
                Notification Preference
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <NotificationPreferences />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}