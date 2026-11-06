// Offline support: serve the viewer from cache, refresh the cache in the background.
// Chats themselves are never cached or sent anywhere; they're read from the zip on the device.
const CACHE = 'chat-viewer-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  // Add assets one by one so a missing optional file (e.g. an icon) doesn't break offline support
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const update = caches.open(CACHE).then(c => fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }));
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || update));
  e.waitUntil(update.catch(() => {}));
});
