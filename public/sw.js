// Service worker ringkas: cache-first untuk aset statik supaya boleh main tanpa talian.
const NAMA = 'asam-garam-v2';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== NAMA).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  if (r.mode === 'navigate') {
    // halaman utama: rangkaian dahulu supaya versi baharu sentiasa dimuatkan
    e.respondWith(fetch(r).then((res) => { const c = res.clone(); caches.open(NAMA).then((k) => k.put(r, c)); return res; }).catch(() => caches.match(r)));
    return;
  }
  e.respondWith(
    caches.open(NAMA).then(async (c) => {
      const cache = await c.match(r);
      const rangkaian = fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => cache);
      return cache || rangkaian;
    }),
  );
});
