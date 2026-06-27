/* Prospector service worker
   Strategy:
   - App shell (this app's own files + Leaflet CDN): cached on install, cache-first.
   - Map tiles (OSM / USGS basemap / Macrostrat + USGS SGMC geology): runtime cache, cache-first.
     This is what makes a "saved" area render offline.
   - BLM ArcGIS claim queries: network-first, fall back to cache (handled mostly in the app).
*/
// Bump SHELL_CACHE whenever the app shell strategy changes — activate purges old shells,
// so existing installs stop serving a stale index.html. (TILE_CACHE keeps saved maps.)
const SHELL_CACHE = 'prospector-shell-v2';
const TILE_CACHE  = 'prospector-tiles-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Hosts whose responses we treat as cacheable map tiles.
const TILE_HOSTS = [
  'tile.openstreetmap.org',
  'basemap.nationalmap.gov',
  'tiles.macrostrat.org',
  'mrdata.usgs.gov',
  'server.arcgisonline.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Add individually so one failure (e.g. offline during install) doesn't abort all.
    await Promise.allSettled(SHELL_ASSETS.map(u => cache.add(new Request(u, { mode: 'no-cors' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![SHELL_CACHE, TILE_CACHE].includes(k)).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

function isTileRequest(url) {
  // Simple tile hosts, plus any ArcGIS cached map tile (…/MapServer/tile/z/y/x).
  if (url.pathname.includes('/MapServer/tile/')) return true;
  return TILE_HOSTS.some(h => url.hostname.endsWith(h));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // App HTML (page navigations + index.html): NETWORK-FIRST so a fresh deploy shows up
  // immediately when online. Falls back to the cached shell only when offline.
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') ||
      (url.origin === self.location.origin && url.pathname === '/')) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok) { const cache = await caches.open(SHELL_CACHE); cache.put('./index.html', res.clone()); }
        return res;
      } catch (e) {
        return (await caches.match(req)) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Map tiles: cache-first (this is the offline magic).
  if (isTileRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(TILE_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req, { mode: 'no-cors' });
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return hit || Response.error();
      }
    })());
    return;
  }

  // App shell / Leaflet: cache-first, fall back to network.
  if (SHELL_ASSETS.some(a => req.url.endsWith(a.replace('./', '/')) ) ||
      url.hostname.endsWith('unpkg.com')) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try { return await fetch(req); } catch (e) { return cached || Response.error(); }
    })());
    return;
  }
  // Everything else (incl. BLM ArcGIS queries): just go to network; app handles offline fallback.
});

// Allow the page to pre-cache a batch of tile URLs for an area ("Save area offline").
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CACHE_TILES' && Array.isArray(data.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(TILE_CACHE);
      let done = 0;
      for (const u of data.urls) {
        try {
          const res = await fetch(new Request(u, { mode: 'no-cors' }));
          if (res && (res.ok || res.type === 'opaque')) await cache.put(u, res.clone());
        } catch (e) { /* skip */ }
        done++;
        if (done % 25 === 0 && event.source) {
          event.source.postMessage({ type: 'CACHE_PROGRESS', done, total: data.urls.length });
        }
      }
      if (event.source) event.source.postMessage({ type: 'CACHE_DONE', done, total: data.urls.length });
    })());
  }
  if (data.type === 'CLEAR_TILES') {
    event.waitUntil(caches.delete(TILE_CACHE));
  }
});
