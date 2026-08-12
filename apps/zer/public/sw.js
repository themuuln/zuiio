const CACHE_VERSION = "zer-v4";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const NAV_CACHE = `${CACHE_VERSION}-nav`;
const API_CACHE = `${CACHE_VERSION}-api`;
const OFFLINE_PAGE = "/offline";

const isStaticAsset = (url) => {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/pwa/") ||
    pathname.match(/\.(css|js|woff2?|png|svg|ico|webp)$/)
  );
};

const isNavigation = (request) => request.mode === "navigate";

// Supabase REST (/rest/v1/*) and internal API routes. GET requests are
// network-first with cache fallback; non-GET (writes) are never touched.
const isApi = (url) => {
  const { pathname } = new URL(url);
  return pathname.startsWith("/rest/v1/") || pathname.startsWith("/api/");
};

// Redirect responses (e.g. / → /login) must never be cached: serving a
// redirected response to a navigation (redirect mode "manual") makes the
// browser abort with ERR_FAILED instead of rendering the page.
const isCacheable = (response) => response.ok && !response.redirected;

/** SWR: start the network refresh, serve `cached` immediately if present. */
const swr = (cache, request) =>
  caches.match(request).then((cached) => {
    const network = fetch(request)
      .then((response) => {
        if (isCacheable(response)) {
          const copy = response.clone();
          cache.then((c) => c.put(request, copy));
        }
        return response;
      })
      .catch(() => cached);
    return cached ?? network;
  });

self.addEventListener("install", (event) => {
  // Precache the offline page so it can be served when navigations fail.
  event.waitUntil(
    caches
      .open(NAV_CACHE)
      .then((cache) => cache.add(OFFLINE_PAGE))
      .catch(() => {}),
  );
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

  // Local development (plain http on localhost/LAN/Tailscale hosts) must not
  // be intercepted: cache-first static + SWR navigation caching serve stale
  // HTML/JS bundles after Turbopack recompiles, producing phantom hydration
  // and render errors in dev logs. Production is always https and keeps the
  // full PWA cache behavior.
  if (self.location.protocol === "http:") return;

  const { request } = event;

  // API requests — network-first, serve cached copy while refreshing in bg
  if (isApi(request.url)) {
    event.respondWith(swr(caches.open(API_CACHE), request));
    return;
  }

  // Static assets — cache-first (hashed filenames, never stale)
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  // Navigation — stale-while-revalidate, offline fallback when uncached
  if (isNavigation(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Serve cached instantly; refresh in background.
          fetch(request)
            .then((response) => {
              if (isCacheable(response)) {
                const copy = response.clone();
                caches
                  .open(NAV_CACHE)
                  .then((cache) => cache.put(request, copy));
              }
              return response;
            })
            .catch(() => {});
          return cached;
        }
        // No cache — try the network, fall back to the offline page.
        return fetch(request)
          .then((response) => {
            if (isCacheable(response)) {
              const copy = response.clone();
              caches.open(NAV_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => caches.match(OFFLINE_PAGE));
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

// ─── Push notifications ─────────────────────────────────────────
// The app can augment a push with `window.__pushPayload` (e.g. {title, body,
// url}). On push we ask open clients for it and wait briefly for an answer
// before falling back to the push payload itself.

const PUSH_PAYLOAD_TIMEOUT_MS = 1500;
let pushRequestId = 0;
const pushPayloadWaiters = new Map();

self.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg?.type !== "PUSH_PAYLOAD_RESPONSE") return;
  const waiter = pushPayloadWaiters.get(msg.requestId);
  if (!waiter) return;
  clearTimeout(waiter.timer);
  pushPayloadWaiters.delete(msg.requestId);
  waiter.resolve(msg.payload);
});

function requestClientPushPayload() {
  return new Promise((resolve) => {
    const requestId = ++pushRequestId;
    const timer = setTimeout(() => {
      pushPayloadWaiters.delete(requestId);
      resolve(null);
    }, PUSH_PAYLOAD_TIMEOUT_MS);
    pushPayloadWaiters.set(requestId, { resolve, timer });
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          try {
            client.postMessage({ type: "PUSH_PAYLOAD_REQUEST", requestId });
          } catch {
            // Client went away mid-request; the timeout resolves null.
          }
        }
      });
  });
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let pushData = {};
      try {
        pushData = event.data ? event.data.json() : {};
      } catch {
        // Payload was not JSON — use the empty default.
      }
      const clientPayload = await requestClientPushPayload();
      const payload =
        clientPayload && typeof clientPayload === "object"
          ? { ...pushData, ...clientPayload }
          : pushData;

      const title = payload.title || "Zer";
      const body = payload.body || "";
      const url = payload.url || "/";
      const icon = payload.icon || "/pwa/icon-192.svg";

      await self.registration.showNotification(title, {
        body,
        icon,
        badge: "/pwa/icon-192.svg",
        data: { url },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("navigate" in client) {
            client.navigate(url);
            client.focus();
            return;
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
