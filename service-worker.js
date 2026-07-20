importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
const CACHE_NAME = 'apnamock-v2'; // Changed to v2 to force update for existing users
const urlsToCache = [
  '/',
  '/index.html',
  '/tests.html',
  '/custom-tests.html',
  '/favorites.html',
  '/history.html',
  '/legal.html',
  '/manifest.json'
];

// 1. Install: Cache the basic pages
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Forces the waiting service worker to become the active one
  );
});

// 2. Activate: Clean up OLD caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Delete any old cache versions
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients immediately
  );
});

// 3. Fetch: Network-First for HTML, Cache-First for everything else
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Only handle GET requests
  if (request.method !== 'GET') return;

  const isHTML = request.mode === 'navigate' || 
                 (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isHTML) {
    // NETWORK-FIRST for HTML pages (Ensures users always get your latest updates)
    event.respondWith(
      fetch(request).then(response => {
        // Save a copy of the new page in the cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        return response;
      }).catch(() => {
        // If offline, fall back to the cached page
        return caches.match(request);
      })
    );
  } else {
    // CACHE-FIRST for CSS, JS, Images, Fonts (Makes site load incredibly fast)
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(networkResponse => {
          // Optionally save new static files to cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return networkResponse;
        });
      })
    );
  }
});
