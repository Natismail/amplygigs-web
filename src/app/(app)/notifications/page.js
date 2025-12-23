// src/app/(app)/notifications/page.js
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useSocial } from '@/context/SocialContext';
import { Bell, Heart, MessageCircle, UserPlus, Share2, Trash2, CheckCheck, Filter } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const { 
    notifications, 
    loading, 
    fetchNotifications,
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    deleteNotification 
  } = useSocial();

  const [filter, setFilter] = useState('all'); // all, unread, follow, like, comment

  useEffect(() => {
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'follow': return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'share': return <Share2 className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification) => {
    await markNotificationAsRead(notification.id);
    
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                filter === 'unread'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setFilter('follow')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                filter === 'follow'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Follows
            </button>
            <button
              onClick={() => setFilter('like')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                filter === 'like'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Likes
            </button>
            <button
              onClick={() => setFilter('comment')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                filter === 'comment'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Comments
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading.notifications ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Notifications
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'unread' 
                ? "You're all caught up!"
                : "You'll see notifications here when people interact with you"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-white dark:hover:bg-gray-800 transition rounded-xl border text-left ${
                  !notification.is_read 
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Icon or Avatar */}
                {notification.related_user ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={notification.related_user.profile_picture_url || '/images/default-avatar.png'}
                      alt={notification.related_user.first_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  {!notification.is_read && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}