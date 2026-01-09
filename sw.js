const CACHE_NAME = 'painel-stream-v5';

// 1. Instalação: Pula a espera para ativar o novo SW imediatamente
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// 2. Ativação: Limpa QUALQUER cache antigo para destravar a tela branca
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// 3. Busca (Fetch): Tenta sempre a internet. Se falhar (offline), usa o cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request) || caches.match('/');
    })
  );
});