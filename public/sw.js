/**
 * No-op service worker.
 * Replaces the old caching SW that was causing loading hangs.
 * This file exists solely to unregister the old registration.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n)))),
  );
  self.clients.claim();
});

// No fetch handler — pass through to network
