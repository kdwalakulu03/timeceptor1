/**
 * Service Worker — Timeceptor PWA
 *
 * Handles:
 *  1. Cache-first strategy for static assets (offline support)
 *  2. Web Push notification display
 *  3. Notification click → open /dashboard
 */

const CACHE_NAME = 'timeceptor-v1';
const STATIC_ASSETS = [
  '/',
  '/app',
  '/dashboard',
  '/manifest.json',
];

// ── Install: pre-cache shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ─────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls
  if (url.pathname.startsWith('/api')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        // Cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline: return cached version or SPA fallback
        return cached || caches.match('/');
      });

      // Return cached immediately, update in background (stale-while-revalidate)
      return cached || fetchPromise;
    })
  );
});

// ── Push notification display ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Timeceptor', body: 'Your peak window is coming up!', url: '/dashboard' };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    // Use defaults
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'open', title: 'See Windows' },
      { action: 'dismiss', title: 'Later' },
    ],
    tag: 'timeceptor-window',      // Collapse duplicate notifications
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification click → open app ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new tab
      return self.clients.openWindow(targetUrl);
    })
  );
});
