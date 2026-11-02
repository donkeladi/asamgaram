// Service worker ringkas: cache-first untuk aset statik supaya boleh main tanpa talian.
const NAMA = 'asam-garam-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== NAMA).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.open(NAMA).then(async (c) => {
      const cache = await c.match(r);
      const rangkaian = fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => cache);
      return cache || rangkaian;
    }),
  );
});
