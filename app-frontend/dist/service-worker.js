/* eslint-disable no-restricted-globals */

// Service Worker for Push Notifications
// This file handles push notifications even when the app is closed

const CACHE_NAME = 'planning-app-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching essential assets');
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]).catch((error) => {
        console.error('[Service Worker] Cache addAll failed:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let notificationData = {
    title: 'Planning App',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    requireInteraction: false,
    data: {
      url: '/'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.type || notificationData.tag,
        requireInteraction: payload.requireInteraction || false,
        data: {
          url: payload.url || payload.data?.url || '/',
          notificationId: payload.notificationId || payload.data?.notificationId,
          type: payload.type || payload.data?.type,
          taskId: payload.taskId || payload.data?.taskId,
          planId: payload.planId || payload.data?.planId,
          ...payload.data
        },
        actions: payload.actions || []
      };

      // Add vibration pattern for urgent notifications
      if (payload.type === 'overdue_task' || payload.priority === 'high') {
        notificationData.vibrate = [200, 100, 200];
      }
    } catch (error) {
      console.error('[Service Worker] Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const notificationId = event.notification.data?.notificationId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window and focus it
      for (const client of clientList) {
        if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
          return client.focus();
        }
      }

      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen).then((windowClient) => {
          // Mark notification as read if we have the ID
          if (windowClient && notificationId) {
            windowClient.postMessage({
              type: 'NOTIFICATION_CLICKED',
              notificationId: notificationId
            });
          }
          return windowClient;
        });
      }
    })
  );
});

// Notification close event - track dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
  
  // You could send analytics or update the server about dismissed notifications
  const notificationId = event.notification.data?.notificationId;
  
  if (notificationId) {
    // Optionally inform the server that the notification was dismissed
    event.waitUntil(
      fetch('/api/notifications/dismissed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      }).catch((error) => {
        console.error('[Service Worker] Failed to report dismissal:', error);
      })
    );
  }
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Fetch event - basic caching strategy (optional, for offline support)
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request).then((fetchResponse) => {
        // Don't cache non-successful responses
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        // Clone and cache the response
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      });
    }).catch(() => {
      // Return a custom offline page if available
      return caches.match('/offline.html');
    })
  );
});

// Periodic background sync (future enhancement)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  try {
    // This could fetch new notifications from the server periodically
    console.log('[Service Worker] Checking for new notifications...');
    // Implementation would depend on your backend API
  } catch (error) {
    console.error('[Service Worker] Failed to check notifications:', error);
  }
}

console.log('[Service Worker] Loaded');
