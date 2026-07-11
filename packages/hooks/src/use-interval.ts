"use client";

import { useEffect, useRef } from "react";

/**
 * Safe `setInterval` wrapper that works with React strict mode and cleans up
 * automatically.
 *
 * Pass `null` as `delay` to pause the interval.
 *
 * @example
 * useInterval(() => setCount(c => c + 1), 1000);
 * useInterval(fetchLatest, polling ? 5000 : null);
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Always store the latest callback so the interval never goes stale.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
