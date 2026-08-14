"use client";

/**
 * Route prefetching utilities for instant navigation.
 * Next.js Link already prefetches on viewport entry, but we can
 * prefetch critical routes earlier for even faster navigation.
 */

// Critical routes that users frequently visit
const CRITICAL_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/pricing",
  "/dashboard",
  "/dashboard/work-orders",
  "/dashboard/customers",
  "/dashboard/inventory",
];

// Prefetch a single route by creating a hidden Link element
function prefetchRoute(route: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = route;
  link.as = "document";
  document.head.appendChild(link);
}

/**
 * Prefetch critical routes after the page is idle.
 * Call this once on the landing page to preload dashboard routes.
 */
export function prefetchCriticalRoutes() {
  if (typeof window === "undefined") return;

  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePrefetch =
    window.requestIdleCallback || ((cb) => setTimeout(cb, 2000));

  schedulePrefetch(() => {
    CRITICAL_ROUTES.forEach(prefetchRoute);
  });
}

/**
 * Prefetch a route on hover for instant navigation.
 * Use this with onMouseEnter on Link components.
 */
export function onLinkHover(route: string) {
  return () => prefetchRoute(route);
}
