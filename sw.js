const CACHE_NAME = 'painel-stream-reset-v1';

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora cache para scripts e navegação para evitar a tela de fundo vazia
  if (event.request.mode === 'navigate' || event.request.destination === 'script') {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});