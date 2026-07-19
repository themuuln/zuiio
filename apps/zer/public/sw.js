const CACHE_VERSION = "zer-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const NAV_CACHE = `${CACHE_VERSION}-nav`;

const isStaticAsset = (url) => {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/pwa/") ||
    pathname.match(/\.(css|js|woff2?|png|svg|ico|webp)$/)
  );
};

const isNavigation = (request) => request.mode === "navigate";

const isApi = (url) => {
  const { pathname } = new URL(url);
  return pathname.startsWith("/api/") || pathname.startsWith("/rest/");
};

// Redirect responses (e.g. / → /login) must never be cached: serving a
// redirected response to a navigation (redirect mode "manual") makes the
// browser abort with ERR_FAILED instead of rendering the page.
const isCacheable = (response) => response.ok && !response.redirected;

self.addEventListener("install", (_event) => {
  // No precache: "/" always 307s (auth-dependent), so there is nothing
  // stable to warm. Caches fill lazily from real navigations instead.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const { request } = event;

  // API requests — network only (ERP data must be fresh)
  if (isApi(request.url)) return;

  // Static assets — cache-first (hashed filenames, never stale)
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  // Navigation — stale-while-revalidate (instant from cache, refresh in bg)
  if (isNavigation(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (isCacheable(response)) {
              const copy = response.clone();
              caches.open(NAV_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);

        return cached ?? fetchPromise;
      }),
    );
    return;
  }

  // Everything else — network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheable(response)) {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
