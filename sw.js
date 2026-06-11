// ── Change this version number every time you update the app ──
const VERSION = 'mfd-roster-v6';
const CACHE_NAME = VERSION;
const ASSETS = ['./','./index.html','./manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => {
      self.clients.claim();
      self.clients.matchAll({includeUncontrolled:true}).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'UPDATE_AVAILABLE', version: VERSION }));
      });
    })
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'MFD Roster', body: 'Duty update.' };
  e.waitUntil(self.registration.showNotification(data.title || 'MFD Roster', {
    body: data.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-96.png',
    vibrate: [200, 100, 200],
    data: data
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
