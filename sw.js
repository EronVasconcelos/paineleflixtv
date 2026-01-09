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

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { 
    title: 'PAINEL STREAM', 
    body: 'Você tem uma nova atualização!' 
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://i.postimg.cc/VNCzbyZV/favicon.png',
      badge: 'https://i.postimg.cc/VNCzbyZV/favicon.png',
      vibrate: [100, 50, 100]
    })
  );
});

// Adicione isso ao final do seu sw.js no GitHub
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});