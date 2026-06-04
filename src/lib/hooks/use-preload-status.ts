"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isPreloaded,
  markPreloaded,
  type PreloadProgress,
  preloadAll,
} from "@/lib/offline/preload-engine";

/**
 * Hook to manage the preload lifecycle.
 * Returns preload progress and a function to trigger preload.
 */
export function usePreloadStatus(orgId: string | undefined) {
  const [progress, setProgress] = useState<PreloadProgress | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const hasPreloadedRef = useRef(false);

  const startPreload = useCallback(async () => {
    if (!orgId || hasPreloadedRef.current) return;
    if (isPreloaded(orgId)) {
      // Already preloaded in this session
      setProgress({
        total: 0,
        done: 0,
        current: "",
        complete: true,
        succeeded: 0,
        failed: 0,
        errors: [],
      });
      return;
    }

    hasPreloadedRef.current = true;
    setIsPreloading(true);

    const result = await preloadAll(orgId, setProgress);
    markPreloaded(orgId);
    setIsPreloading(false);

    return result;
  }, [orgId]);

  // Auto-start preload when orgId is available
  useEffect(() => {
    if (orgId && !hasPreloadedRef.current && !isPreloaded(orgId)) {
      startPreload();
    } else if (orgId && isPreloaded(orgId)) {
      setProgress({
        total: 0,
        done: 0,
        current: "",
        complete: true,
        succeeded: 0,
        failed: 0,
        errors: [],
      });
    }
  }, [orgId, startPreload]);

  return { progress, isPreloading, startPreload };
}
