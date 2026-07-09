/**
 * Prestige Garage Service Worker
 * ------------------------------
 * Required for `beforeinstallprompt` to fire on Chrome/Android.
 * Without a registered SW, the install prompt NEVER appears.
 *
 * Strategies:
 *   - CacheFirst    : brand images (crown, SONAX badge) — never change
 *   - StaleWhileRevalidate : fonts, manifest, static assets
 *   - NetworkFirst  : /api/* (always fresh), pages (fallback to offline)
 */

const CACHE_VERSION = "prestige-garage-v2-1";
const PRECACHE = [
  "/",
  "/manifest.json",
  "/images/33562fbd-0491-47ac-9773-54319394fa7f.png",
  "/images/Logo_Authorized_Detailer-1.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // /api/* → NetworkFirst
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || new Response("Offline", { status: 503 })))
    );
    return;
  }

  // Brand images → CacheFirst
  if (url.pathname.startsWith("/images/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  // Everything else → StaleWhileRevalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached || new Response("Offline", { status: 503 }));
      return cached || fetchPromise;
    })
  );
});
