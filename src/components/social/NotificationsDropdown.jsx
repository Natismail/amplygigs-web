// src/components/social/NotificationsDropdown.js - FINAL FIX
"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useSocial } from '@/context/SocialContext';
import { Heart, MessageCircle, UserPlus, Share2, Trash2, CheckCheck, Bell } from 'lucide-react';

export default function NotificationsDropdown({ onClose }) {
  const router = useRouter();
  const { 
    notifications, 
    loading, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    deleteNotification 
  } = useSocial();

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
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading.notifications ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Bell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            // FIXED: Changed from button to div
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 cursor-pointer ${
                !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
              }`}
            >
              {/* Icon or Avatar */}
              {notification.related_user ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={notification.related_user.profile_picture_url || '/images/default-avatar.png'}
                    alt={notification.related_user.first_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>

              {/* Unread Badge & Delete */}
              <div className="flex flex-col items-end gap-2">
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                <button
                  onClick={(e) => handleDelete(e, notification.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={() => {
              router.push('/notifications');
              onClose();
            }}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}