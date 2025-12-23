// src/components/social/NotificationBell.js
"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import NotificationsDropdown from './NotificationsDropdown';

export default function NotificationBell() {
  const { unreadNotificationsCount, fetchNotifications, subscribeToNotifications } = useSocial();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to realtime notifications
    const channel = subscribeToNotifications();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      channel?.unsubscribe();
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 z-50">
            <NotificationsDropdown onClose={() => setShowDropdown(false)} />
          </div>
        </>
      )}
    </div>
  );
}