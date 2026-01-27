// Service Worker para PWA Finanzas Personales
// SOLO para habilitar instalación PWA - SIN CACHÉ
const CACHE_VERSION = 'v5-no-cache-20260111';

// Instalación - sin cachear nada
self.addEventListener('install', (event) => {
  console.log('[SW] PWA instalada - sin caché');
  self.skipWaiting();
});

// Activación - eliminar cualquier caché existente
self.addEventListener('activate', (event) => {
  console.log('[SW] Limpiando todas las cachés...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW] Eliminando caché:', key);
          return caches.delete(key);
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - SIEMPRE desde la red, NUNCA cachear
self.addEventListener('fetch', (event) => {
  // Importante: NO reescribir headers.
  // Si se sobreescriben, se pierden headers críticos (apikey/Authorization)
  // y se rompe Supabase y/o Server Actions.
  const request = new Request(event.request, { cache: 'no-store' })
  event.respondWith(fetch(request).catch(() => fetch(event.request)))
});

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    // Retornar respuesta vacía en lugar de fallar
    return new Response('', { status: 408, statusText: 'Request Timeout' });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse && networkResponse.ok) {
      try {
        const cache = await caches.open(cacheName);
        // Clone BEFORE using the response
        await cache.put(request, networkResponse.clone());
      } catch (error) {
        console.log('[SW] Cache put failed:', error);
      }
    }
    return networkResponse;
  }).catch((error) => {
    console.log('[SW] Network fetch failed, using cache');
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

// Escuchar mensajes para limpiar caché
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano para subir facturas offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-receipts') {
    event.waitUntil(syncReceipts());
  }
});

async function syncReceipts() {
  // Obtener datos pendientes de IndexedDB
  console.log('[SW] Syncing receipts...');
  // Esta función se implementará con IndexedDB
  // para almacenar facturas que se suben offline
}

// Notificación de push (para alertas futuras)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    data: data.url,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Finanzas', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || '/dashboard');
      }
    })
  );
});
