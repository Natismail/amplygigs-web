// AmplyGigs Service Worker for Push Notifications
const CACHE_NAME = 'amplygigs-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();
  
  // Open or focus the AmplyGigs app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url.includes('localhost') || client.url.includes('amplygigs')) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      return self.clients.openWindow('/');
    })
  );
});

// Handle push events (for future server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'amplygigs-notification',
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'AmplyGigs', options)
    );
  }
});

// Handle notification actions
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'view') {
    // Handle view action
    event.waitUntil(
      self.clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Handle dismiss action
    event.notification.close();
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationData());
  }
});

async function syncLocationData() {
  // Sync any pending location updates when back online
  console.log('Syncing location data...');
  // This would integrate with your Supabase sync logic
}