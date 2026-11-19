// CSE Notes service worker: installability and notifications.
// Offline caching is handled in the next revision of this file.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request).catch(() => new Response('You are offline. Please reconnect to read your notes.', { status: 503, headers: { 'Content-Type': 'text/plain' } })));
});

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
