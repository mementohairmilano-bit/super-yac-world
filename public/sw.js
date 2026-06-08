// Service worker di Super Yac World (PWA) — con PRECACHE per il gioco OFFLINE.
// All'installazione scarica e mette in cache TUTTI i file del gioco (lista in precache.json,
// generata dal build) → dopo la prima visita il gioco è giocabile senza rete. Le chiamate
// cross-origin (Supabase/classifica) NON vengono toccate → la classifica resta "live" (richiede
// rete; offline mostra l'ultima cache). BUILD cambia a ogni deploy: il SW si re-installa e
// ri-precacha SOLO i file nuovi (gli asset con hash invariato non vengono riscaricati = poca banda).
const CACHE = 'syw-pwa';
const BUILD = '__BUILD__';   // sostituito dal build (vite.config) → forza l'aggiornamento del SW

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    try { await c.put('/index.html', await fetch('/index.html', { cache: 'reload' })); } catch (_) {}
    // precache completo (salta i file già in cache → niente ri-download sugli aggiornamenti)
    try {
      const res = await fetch('/precache.json?b=' + BUILD, { cache: 'reload' });
      if (res.ok) {
        const list = await res.json();
        await Promise.allSettled(list.map(async (u) => {
          if (await c.match(u)) return;
          const r = await fetch(u, { cache: 'reload' });
          if (r && r.ok) await c.put(u, r);
        }));
      }
    } catch (_) {}
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
  if (url.pathname.startsWith('/api/')) { e.respondWith(fetch(req)); return; }   // funzioni serverless: sempre rete, mai cache

  // navigazioni: prima la rete fresca (aggiornamenti immediati), poi la cache come fallback OFFLINE
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await fetch(req, { cache: 'reload' }); }
      catch (err) { return (await caches.match('/index.html')) || (await caches.match('/')) || Response.error(); }
    })());
    return;
  }

  // asset (js/css/immagini/audio…): cache prima (offline), poi rete (e mette in cache)
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
