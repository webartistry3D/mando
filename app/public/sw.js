/// <reference lib="webworker" />

const CACHE_NAME = 'mando-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Skip non-GET and API requests — always go to network for API
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for shell assets
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return the cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html') as Promise<Response>;
          }
          return Response.error();
        });
      })
  );
});
