/* Service worker — network-first for HTML & JS/CSS so deploys never break the site */
const CACHE_NAME = "kailash-temple-pwa-v3";

/** Only cache static files that rarely change — never cache index.html or /assets/* */
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/favicon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

const isNavigation = (request) =>
  request.mode === "navigate" ||
  request.headers.get("accept")?.includes("text/html");

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // HTML / SPA routes — always fetch fresh (fixes 404 after new deploy)
  if (isNavigation(event.request)) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/index.html").then((r) => r || caches.match("/"))
      )
    );
    return;
  }

  // Vite hashed bundles — never serve stale cache (filename changes each build)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Icons & manifest — cache first is fine
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok && PRECACHE_ASSETS.includes(url.pathname)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
    )
  );
});
