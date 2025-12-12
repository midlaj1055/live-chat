// Service Worker for Live Chat PWA
const CACHE_NAME = 'live-chat-v1';
const urlsToCache = [
  '/live-chat/',
  '/live-chat/index.html',
  '/live-chat/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Fail silently if URLs are not available during install
        console.log('Some assets could not be cached');
      });
    })
  );
  self.skipWaiting();
});

// Fetch event - cache first, fallback to network
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) return response;

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Do not cache if response is not ok
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone response and cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return cached response on network error, or offline page
          return caches.match('/live-chat/index.html');
        });
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
