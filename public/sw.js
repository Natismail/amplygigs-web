// public/sw.js
const CACHE_NAME = 'amplygigs-v2'; // ⚠️ Changed version to force update
const RUNTIME_CACHE = 'amplygigs-runtime';
const IMAGE_CACHE = 'amplygigs-images';

const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html', // Changed from '/offline' to '/offline.html'
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/badge-72.png',
];

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ CRITICAL FIX: Skip ALL Next.js app routes and navigation
  if (request.mode === 'navigate' || 
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/api/') ||
      url.searchParams.has('_rsc')) { // Next.js RSC requests
    console.log('⚡ Bypassing cache for:', url.pathname);
    return; // Let Next.js handle it completely
  }

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase requests - always fresh
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Handle images - Cache First
  if (request.destination === 'image' || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Handle static assets (only non-Next.js assets)
  if (url.pathname.match(/\.(css|js|woff2?|ttf|eot)$/) && 
      !url.pathname.startsWith('/_next/')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }
});

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('⚡ Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Network error', { status: 408 });
  }
}

// Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Keep your notification and sync handlers as-is
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});





// // public/sw.js
// // AmplyGigs Enhanced Service Worker with Cache Optimization

// const CACHE_NAME = 'amplygigs-v1';
// const RUNTIME_CACHE = 'amplygigs-runtime';
// const IMAGE_CACHE = 'amplygigs-images';

// // Assets to cache on install
// const STATIC_ASSETS = [
//   '/',
//   '/manifest.json',
//   '/offline',
//   '/icons/icon-192.png',
//   '/icons/icon-512.png',
//   '/icons/badge-72.png',
// ];

// // Install event - cache static assets
// self.addEventListener('install', (event) => {
//   console.log('🔧 Service Worker installing...');
  
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then((cache) => {
//         console.log('📦 Caching static assets');
//         return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {cache: 'reload'})));
//       })
//       .catch((err) => {
//         console.error('❌ Cache failed:', err);
//       })
//       .then(() => {
//         console.log('✅ Service Worker installed');
//         return self.skipWaiting();
//       })
//   );
// });

// // Activate event - clean up old caches
// self.addEventListener('activate', (event) => {
//   console.log('✅ Service Worker activating...');
  
//   event.waitUntil(
//     caches.keys()
//       .then((cacheNames) => {
//         return Promise.all(
//           cacheNames.map((cacheName) => {
//             if (cacheName !== CACHE_NAME && 
//                 cacheName !== RUNTIME_CACHE && 
//                 cacheName !== IMAGE_CACHE) {
//               console.log('🗑️ Deleting old cache:', cacheName);
//               return caches.delete(cacheName);
//             }
//           })
//         );
//       })
//       .then(() => {
//         console.log('🎯 Service Worker activated and claiming clients');
//         return self.clients.claim();
//       })
//   );
// });

// // Fetch event - intelligent caching strategy
// self.addEventListener('fetch', (event) => {
//   const { request } = event;
//   const url = new URL(request.url);

//   // Skip non-GET requests
//   if (request.method !== 'GET') return;

//   // Skip cross-origin requests except for CDN resources
//   if (url.origin !== location.origin && !url.origin.includes('supabase')) {
//     return;
//   }

//   // Handle Supabase API requests - Network First
//   if (url.hostname.includes('supabase')) {
//     event.respondWith(networkFirst(request, RUNTIME_CACHE));
//     return;
//   }

//   // Handle API requests - Network First
//   if (url.pathname.startsWith('/api/')) {
//     event.respondWith(networkFirst(request, RUNTIME_CACHE));
//     return;
//   }

//   // Handle images - Cache First
//   if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
//     event.respondWith(cacheFirst(request, IMAGE_CACHE));
//     return;
//   }

//   // Handle navigation - Network First with cache fallback
//   if (request.mode === 'navigate') {
//     event.respondWith(networkFirstNavigation(request));
//     return;
//   }

//   // Handle static assets (JS, CSS) - Stale While Revalidate
//   if (request.destination === 'script' || request.destination === 'style') {
//     event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
//     return;
//   }

//   // Default - Cache First
//   event.respondWith(cacheFirst(request, CACHE_NAME));
// });

// // Network First Strategy (for API calls)
// async function networkFirst(request, cacheName) {
//   try {
//     const networkResponse = await fetch(request);
    
//     // Clone and cache the response if successful
//     if (networkResponse.ok) {
//       const cache = await caches.open(cacheName);
//       cache.put(request, networkResponse.clone());
//     }
    
//     return networkResponse;
//   } catch (error) {
//     console.log('🌐 Network failed, trying cache for:', request.url);
    
//     // Network failed, try cache
//     const cachedResponse = await caches.match(request);
    
//     if (cachedResponse) {
//       console.log('📦 Serving from cache:', request.url);
//       return cachedResponse;
//     }
    
//     // Return offline response
//     return new Response(JSON.stringify({ error: 'Offline' }), {
//       status: 503,
//       statusText: 'Service Unavailable',
//       headers: { 'Content-Type': 'application/json' }
//     });
//   }
// }

// // Network First for Navigation (with offline page)
// async function networkFirstNavigation(request) {
//   try {
//     const networkResponse = await fetch(request);
    
//     if (networkResponse.ok) {
//       const cache = await caches.open(RUNTIME_CACHE);
//       cache.put(request, networkResponse.clone());
//     }
    
//     return networkResponse;
//   } catch (error) {
//     console.log('🌐 Network failed for navigation, trying cache');
    
//     const cachedResponse = await caches.match(request);
    
//     if (cachedResponse) {
//       console.log('📦 Serving cached page:', request.url);
//       return cachedResponse;
//     }
    
//     // Show offline page
//     const offlinePage = await caches.match('/offline');
//     if (offlinePage) {
//       return offlinePage;
//     }
    
//     return new Response('Offline', {
//       status: 503,
//       statusText: 'Service Unavailable',
//     });
//   }
// }

// // Cache First Strategy (for images and static assets)
// async function cacheFirst(request, cacheName) {
//   const cachedResponse = await caches.match(request);
  
//   if (cachedResponse) {
//     console.log('⚡ Serving from cache:', request.url);
//     return cachedResponse;
//   }
  
//   try {
//     const networkResponse = await fetch(request);
    
//     if (networkResponse.ok) {
//       const cache = await caches.open(cacheName);
//       cache.put(request, networkResponse.clone());
//     }
    
//     return networkResponse;
//   } catch (error) {
//     console.error('❌ Fetch failed:', error);
//     return new Response('Network error', {
//       status: 408,
//       statusText: 'Request Timeout',
//     });
//   }
// }

// // Stale While Revalidate (for JS/CSS)
// async function staleWhileRevalidate(request, cacheName) {
//   const cache = await caches.open(cacheName);
//   const cachedResponse = await cache.match(request);
  
//   const fetchPromise = fetch(request).then((networkResponse) => {
//     if (networkResponse.ok) {
//       cache.put(request, networkResponse.clone());
//     }
//     return networkResponse;
//   }).catch(() => cachedResponse);
  
//   return cachedResponse || fetchPromise;
// }

// // Handle notification clicks
// self.addEventListener('notificationclick', (event) => {
//   console.log('🔔 Notification clicked:', event.notification.tag);
  
//   event.notification.close();
  
//   const urlToOpen = event.notification.data?.url || '/';
  
//   event.waitUntil(
//     self.clients.matchAll({ type: 'window', includeUncontrolled: true })
//       .then((clients) => {
//         // Focus existing window if open
//         for (const client of clients) {
//           if (client.url === urlToOpen && 'focus' in client) {
//             return client.focus();
//           }
//         }
        
//         // Open new window if none exists
//         if (self.clients.openWindow) {
//           return self.clients.openWindow(urlToOpen);
//         }
//       })
//   );
// });

// // Handle push notifications
// self.addEventListener('push', (event) => {
//   console.log('📬 Push notification received');
  
//   let data = { title: 'AmplyGigs', body: 'You have a new notification' };
  
//   if (event.data) {
//     try {
//       data = event.data.json();
//     } catch (e) {
//       data.body = event.data.text();
//     }
//   }
  
//   const options = {
//     body: data.body,
//     icon: '/icons/icon-192.png',
//     badge: '/icons/badge-72.png',
//     vibrate: [200, 100, 200],
//     tag: data.tag || 'amplygigs-notification',
//     requireInteraction: data.requireInteraction || false,
//     actions: [
//       { action: 'view', title: 'View', icon: '/icons/badge-72.png' },
//       { action: 'dismiss', title: 'Dismiss' }
//     ],
//     data: { url: data.url || '/' }
//   };
  
//   event.waitUntil(
//     self.registration.showNotification(data.title, options)
//   );
// });

// // Handle background sync
// self.addEventListener('sync', (event) => {
//   console.log('🔄 Background sync:', event.tag);
  
//   if (event.tag === 'sync-bookings') {
//     event.waitUntil(syncBookings());
//   }
  
//   if (event.tag === 'sync-messages') {
//     event.waitUntil(syncMessages());
//   }
// });

// async function syncBookings() {
//   try {
//     console.log('📡 Syncing bookings...');
//     // Implement your booking sync logic here
//     const response = await fetch('/api/bookings/sync', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' }
//     });
    
//     if (response.ok) {
//       console.log('✅ Bookings synced successfully');
//     }
    
//     return Promise.resolve();
//   } catch (error) {
//     console.error('❌ Sync failed:', error);
//     return Promise.reject(error);
//   }
// }

// async function syncMessages() {
//   try {
//     console.log('📡 Syncing messages...');
//     // Implement your message sync logic here
//     return Promise.resolve();
//   } catch (error) {
//     console.error('❌ Message sync failed:', error);
//     return Promise.reject(error);
//   }
// }

// // Handle messages from clients
// self.addEventListener('message', (event) => {
//   console.log('📨 Message received:', event.data);
  
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     self.skipWaiting();
//   }
  
//   if (event.data && event.data.type === 'CACHE_URLS') {
//     event.waitUntil(
//       caches.open(RUNTIME_CACHE)
//         .then((cache) => cache.addAll(event.data.urls))
//         .then(() => {
//           console.log('✅ URLs cached:', event.data.urls);
//         })
//     );
//   }
  
//   if (event.data && event.data.type === 'CLEAR_CACHE') {
//     event.waitUntil(
//       caches.keys()
//         .then((cacheNames) => {
//           return Promise.all(
//             cacheNames.map((cacheName) => caches.delete(cacheName))
//           );
//         })
//         .then(() => {
//           console.log('🗑️ All caches cleared');
//         })
//     );
//   }
// });