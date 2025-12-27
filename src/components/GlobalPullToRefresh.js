// src/components/GlobalPullToRefresh.js
"use client";

import { usePathname } from 'next/navigation';
import { useSocial } from '@/context/SocialContext';
import PullToRefresh from './PullToRefresh';

/**
 * Global Pull-to-Refresh wrapper
 * Automatically refreshes appropriate data based on current route
 */
export default function GlobalPullToRefresh({ children }) {
  const pathname = usePathname();
  const { fetchNotifications, fetchConversations, fetchFeed } = useSocial();

  // Determine what to refresh based on current route
  const getRefreshFunction = () => {
    // Messages page
    if (pathname.includes('/messages') || pathname.includes('/chat')) {
      return async () => {
        console.log('🔄 Refreshing messages...');
        await fetchConversations();
      };
    }

    // Feed/Social page
    if (pathname.includes('/feed')) {
      return async () => {
        console.log('🔄 Refreshing feed...');
        await fetchFeed();
      };
    }

    // Notifications page
    if (pathname.includes('/notifications')) {
      return async () => {
        console.log('🔄 Refreshing notifications...');
        await fetchNotifications();
      };
    }

    // Profile pages
    if (pathname.includes('/profile')) {
      return async () => {
        console.log('🔄 Refreshing profile...');
        // Profile data will be refreshed by the page itself
        window.location.reload(); // Simple fallback
      };
    }

    // Events pages
    if (pathname.includes('/events') || pathname.includes('/gigs')) {
      return async () => {
        console.log('🔄 Refreshing events...');
        window.location.reload(); // Simple fallback for now
      };
    }

    // Dashboard/Home pages
    if (pathname.includes('/dashboard') || pathname.includes('/home')) {
      return async () => {
        console.log('🔄 Refreshing dashboard...');
        await Promise.all([
          fetchNotifications(),
          fetchConversations(),
        ]);
      };
    }

    // Network page
    if (pathname.includes('/network')) {
      return async () => {
        console.log('🔄 Refreshing network...');
        window.location.reload(); // Simple fallback
      };
    }

    // Default: refresh notifications and conversations
    return async () => {
      console.log('🔄 Refreshing app data...');
      await Promise.all([
        fetchNotifications(),
        fetchConversations(),
      ]);
    };
  };

  const handleRefresh = getRefreshFunction();

  // Only enable pull-to-refresh on specific routes
  const enabledRoutes = [
    '/messages',
    '/chat',
    '/feed',
    '/notifications',
    '/profile',
    '/events',
    '/gigs',
    '/dashboard',
    '/home',
    '/network',
    '/musician',
    '/client',
    '/src/app/(app)/payment',
    '/src/app/(app)/admin',
    '/src/app/(app)/booking',
    '/src/app/(app)/kyc',
  ];

  const isEnabled = enabledRoutes.some(route => pathname.includes(route));

  // If pull-to-refresh is not enabled for this route, just render children
  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  );
}