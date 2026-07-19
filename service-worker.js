const CACHE_NAME = 'apnamock-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/tests.html',
  '/custom-tests.html',
  '/favorites.html',
  '/history.html',
  '/legal.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached page if found, otherwise fetch from network
        return response || fetch(event.request);
      })
  );
});
