// CvSU Library Service Worker
const CACHE_NAME = 'cvsu-library-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/users') ||
      event.request.url.includes('/books') || event.request.url.includes('/pcs') ||
      event.request.url.includes('/attendance') || event.request.url.includes('/requests') ||
      event.request.url.includes('/notifications')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let notificationData = {
    title: 'CvSU Library',
    body: 'You have a notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'library-notification',
    requireInteraction: true,
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png'
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: [200, 100, 200],
      data: notificationData.data,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'check-due-dates') {
    event.waitUntil(checkDueDates());
  }
});

// Periodic background sync for due date checks
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  if (event.tag === 'check-due-dates') {
    event.waitUntil(checkDueDates());
  }
});

async function checkDueDates() {
  // This will be triggered by the backend or periodic sync
  console.log('[SW] Checking due dates...');
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url } = event.data;
    self.registration.showNotification(title, {
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'due-date-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: url || '/student' },
      actions: [
        { action: 'view', title: 'View Books' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});
