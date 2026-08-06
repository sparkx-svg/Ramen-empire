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
const APP_VERSION = '1.9.2';
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
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })()
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
      // For navigations, prefer the preloaded response over starting a
      // second fetch — the preload request was already in flight before
      // this handler even ran, so reusing it avoids a redundant request.
      // event.preloadResponse only exists on browsers that support the
      // Navigation Preload API (older Safari doesn't). Calling .then() on
      // it unconditionally throws a TypeError there and breaks every
      // navigation in that browser, so only use it when it's actually
      // present.
      const networkFetch = (event.request.mode === 'navigate' && event.preloadResponse
        ? event.preloadResponse.then(r => r || fetch(event.request))
        : fetch(event.request))
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

// ---------- notifications ----------
// showNotification() works even while the tab is backgrounded (not focused),
// as long as the browser process itself is still running — that covers
// "come back and claim your challenge reward" while the person has the game
// open in another tab or minimized. It does NOT cover notifying someone
// after they've fully closed the browser; that requires a real push message
// from a server (Firebase Cloud Messaging + a Cloud Function watching
// Firestore), which needs the Blaze billing plan and isn't set up here yet.
self.addEventListener('message', event => {
  if(event.data && event.data.type === 'show-notification'){
    const { title, body, tag } = event.data;
    self.registration.showNotification(title, {
      body,
      tag,               // reuses/replaces a notification with the same tag instead of stacking duplicates
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png'
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const existing = clientsArr.find(c => 'focus' in c);
      if(existing) return existing.focus();
      return self.clients.openWindow('./');
    })
  );
});

// Placeholder for real server-sent push (e.g. "a friend passed you on the
// leaderboard"). Wiring this up requires Firebase Cloud Messaging on the
// client plus a Cloud Function that watches Firestore and sends the push —
// not implemented yet.
self.addEventListener('push', event => {
  if(!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ramen Empire', {
      body: data.body || '',
      icon: './icons/icon-192.png'
    })
  );
});
