// Service Worker para PWA Finanzas Personales
const CACHE_VERSION = 'v3-20260110'; // Versión actualizada para forzar limpieza
const CACHE_NAME = `finanzas-personales-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Recursos estáticos para cachear en la instalación
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// URLs que NUNCA deben ser cacheadas (datos dinámicos)
const NEVER_CACHE = [
  '/api/',
  'supabase.co',
  'vercel-insights',
  'vercel-analytics'
];

// Función para verificar si una URL debe ser ignorada del caché
function shouldNeverCache(url) {
  return NEVER_CACHE.some(pattern => url.includes(pattern));
}

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            // Borrar todas las cachés viejas
            return !key.includes(CACHE_VERSION);
          })
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia de caché: Network First con fallback a caché
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean del mismo origen o durante desarrollo
  if (url.origin !== location.origin) {
    return;
  }

  // NUNCA cachear datos de API o Supabase
  if (shouldNeverCache(url.href)) {
    event.respondWith(fetch(request));
    return;
  }

  // Ignorar requests de desarrollo de Next.js
  if (
    url.pathname.startsWith('/_next/webpack') ||
    url.pathname.startsWith('/_next/static/webpack') ||
    url.pathname.includes('hot-update') ||
    url.pathname.startsWith('/api/realtime')
  ) {
    return;
  }

  // Estrategia para imágenes: Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Estrategia para documentos HTML: Network First (sin caché de datos)
  if (request.destination === 'document') {
    event.respondWith(networkFirstNoCache(request));
    return;
  }

  // Estrategia para assets estáticos: Stale While Revalidate
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Para el resto: Network Only (no cachear datos dinámicos)
  event.respondWith(fetch(request));
});

// Network First Strategy sin caché de datos
async function networkFirstNoCache(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy (legacy)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Si no hay caché, retornar página offline
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

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
