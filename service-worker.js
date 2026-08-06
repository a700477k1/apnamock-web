importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
const CACHE_NAME = 'apnamock-v4'; // Incremented to v4 to force update
const urlsToCache = [
  '/',
  '/index.html',
  '/tests.html',
  '/custom-tests.html',
  '/favorites.html',
  '/history.html',
  '/result.html',
  '/quiz.html',
  '/jobs.html',
  '/job.html',
  '/rapid-fire.html',
  '/legal.html',
  '/manifest.json',
  '/offline.html', 
  '/404.html'      
];

// 1. Install: Cache all the core pages
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate: Clean up OLD caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Network-First for HTML, Cache-First for everything else
self.addEventListener('fetch', event => {
  const request = event.request;
  
  if (request.method !== 'GET') return;

  const isHTML = request.mode === 'navigate' || 
                 (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isHTML) {
    // NETWORK-FIRST for HTML pages
    event.respondWith(
      fetch(request).then(response => {
        // If the page doesn't exist on the server (404), serve our custom 404 page
        if (response.status === 404) {
          return caches.match('/404.html');
        }
        // Save a copy of the new page in the cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        return response;
      }).catch(() => {
        // If offline, try to serve from cache
        return caches.match(request).then(cachedResponse => {
          // If the page isn't in the cache, serve the offline fallback page
          return cachedResponse || caches.match('/offline.html');
        });
      })
    );
  } else {
    // CACHE-FIRST for CSS, JS, Images, Fonts
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return networkResponse;
        });
      })
    );
  }
});
