"use client";

import { useEffect, useRef } from "react";

/**
 * Returns true on the first render, false after the first effect fires.
 * Used for layout-preserving skeletons — don't show a loading state on
 * the very first render (let the server-rendered content display), but
 * do show it on subsequent client navigations.
 */
export function useIsFirstLoad(isReady: boolean): boolean {
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (isReady && !hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
    }
  }, [isReady]);

  return !hasLoadedOnceRef.current;
}
