// CSE Notes service worker: app-shell caching, offline fallback and notifications.

const CACHE = 'cse-v1';
const PDF_CACHE = 'cse-pdfs';

/* App shell. Bump CACHE when any of these files change. */
const CORE = [
  '/', '/index.html', '/style.css', '/manifest.json',
  '/icon-180.png', '/icon-192.png', '/icon-512.png',
  '/js/config.js', '/js/icons.js', '/js/state.js', '/js/utils.js',
  '/js/app.js', '/js/views.js', '/js/data.js', '/js/pdf-compress.js',
  '/js/viewer.js', '/js/notifications.js', '/js/offline-queue.js', '/js/events.js'
];

/* Third-party libraries needed for the app to boot offline. */
const CDN = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map(url => cache.add(url).catch(() => { })));
    await Promise.all(CDN.map(url => cache.add(new Request(url, { mode: 'cors' })).catch(() => { })));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE && k !== PDF_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Supabase data/storage must always be live. The app keeps its own snapshot. */
  if (url.hostname.endsWith('.supabase.co')) return;

  if (req.mode === 'navigate') { e.respondWith(networkFirst(req)); return; }

  if (url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(staleWhileRevalidate(req));
  }
});

/* Pages: network first, cached shell as the offline fallback. */
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(CACHE);
    cache.put('/index.html', res.clone());
    return res;
  } catch (err) {
    const cache = await caches.open(CACHE);
    return (await cache.match('/index.html')) || (await cache.match('/')) ||
      new Response('You are offline. Reconnect once to save the app for offline use.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

/* Static assets: serve cached immediately, refresh in the background. */
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || (await network) || new Response('Offline', { status: 503 });
}

/* Focus or open the app when a notification is clicked. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const client of list) {
      if ('focus' in client) { if ('navigate' in client) client.navigate(url); return client.focus(); }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});

/* Web Push support (ready for a future push backend). */
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || 'CSE Department', {
    body: data.body || 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'cse-update',
    data: { url: data.url || '/' }
  }));
});
