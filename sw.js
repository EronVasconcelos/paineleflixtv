const CACHE_NAME = 'painel-stream-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Tenta o cache, se não tiver, tenta a rede
      return response || fetch(event.request).catch(() => {
        // Se falhar e for navegação, retorna a raiz limpa
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});