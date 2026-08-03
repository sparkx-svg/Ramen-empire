// Ramen Empire service worker
//
// Strategy: stale-while-revalidate. Every GET is served from cache
// immediately if we have it (fast, works offline), while a network
// request runs in the background to refresh the cache for next time.
// This trades "always the absolute latest asset" for snappier loads,
// which is the right call for a game that's almost entirely static
// assets — gameplay state itself lives in localStorage, not in these
// files, so briefly serving a cached script.js is harmless; the user
// gets the update on their *next* load once the background fetch lands.
//
// Cache busting: bump APP_VERSION on every deploy that changes any file
// in CORE_ASSETS. That changes CACHE_NAME, which makes install() populate
// a fresh cache and activate() delete the old one — so users can't get
// stuck on stale assets indefinitely even with SWR serving cache-first.
// Forgetting to bump this is the main way this strategy goes stale, so
// treat it like a changelog entry: bump it, don't skip it.
const APP_VERSION = '1.1.0';
const CACHE_NAME = 'ramen-empire-v' + APP_VERSION;

const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);

      // Always kick off a network fetch to refresh the cache, whether or
      // not we have a cached copy to serve right now. Fire-and-forget when
      // there's a cached response to return immediately; awaited when there
      // isn't, since then it's the only way to answer the request at all.
      const networkFetch = fetch(event.request)
        .then(response => {
          if(response && response.ok){
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      if(cached){
        // networkFetch is already running (fetch() started executing the
        // moment it was assigned above) — we just don't await it here, so
        // the cached response goes out immediately and the cache gets
        // refreshed in the background for the next request.
        return cached;
      }

      const fresh = await networkFetch;
      return fresh || cache.match('./index.html');
    })
  );
});
