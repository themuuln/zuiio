"use client";

import { useEffect } from "react";

/**
 * One-time cleanup: unregister old service worker and clear stale caches.
 * Remove this component after a production deploy cycle (~1 week).
 */
export function SwCleanup() {
  useEffect(() => {
    (async () => {
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
        // Non-critical cleanup
      }
    })();
  }, []);

  return null;
}
