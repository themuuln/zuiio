"use client";

/**
 * One-time cleanup: unregister old service worker and clear stale caches.
 * Remove this file after a production deploy cycle (~1 week).
 */
export async function cleanupOldServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  try {
    // Clear all caches from the old SW
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (name.startsWith("tolom-")) {
        await caches.delete(name);
      }
    }

    // Unregister all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  } catch {
    // Silently ignore — non-critical cleanup
  }
}
