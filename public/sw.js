// Service worker di Super Yac World (PWA).
// Strategia: runtime caching same-origin (offline DOPO la prima visita), navigazioni
// network-first con fallback a index. Le chiamate cross-origin (Supabase/classifica) NON
// vengono toccate → la classifica resta sempre "live" e non funziona offline (corretto).
const CACHE = 'syw-v1';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    try { const c = await caches.open(CACHE); await c.addAll(['/', '/index.html']); } catch (err) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // lascia passare Supabase & co.

  // navigazioni: rete prima, poi cache (offline)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await fetch(req); }
      catch (err) { return (await caches.match(req)) || (await caches.match('/index.html')) || (await caches.match('/')) || Response.error(); }
    })());
    return;
  }

  // asset (js/css/png/audio…): cache prima, poi rete (e mette in cache)
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (net && net.ok && net.type === 'basic') {
        const c = await caches.open(CACHE); c.put(req, net.clone());
      }
      return net;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
