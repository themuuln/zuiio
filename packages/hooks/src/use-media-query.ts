"use client";

import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query. Returns `true` when the query matches.
 *
 * SSR-safe: defaults to `false` on the server and on initial client render
 * before the effect runs, so avoid using the return value for layout-critical
 * decisions — prefer CSS media queries for those.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 640px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
