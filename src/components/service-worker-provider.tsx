"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/sw-register";

/**
 * Client component that registers the service worker.
 * Add this to the root layout to enable offline support.
 */
export function ServiceWorkerProvider() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
