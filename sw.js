/* Horizon Site Survey PWA Service Worker */
const VERSION = 'v1.0.0';
const STATIC_CACHE = `horizon-static-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('horizon-static-') && k !== STATIC_CACHE).map(k => caches.delete(k)))) 
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Cache-first for same-origin
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        // update runtime cache
        const copy = resp.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(req, copy));
        return resp;
      }).catch(() => caches.match('./index.html')))
    );
  } else {
    // Network-first for cross-origin, fallback to cache
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});
