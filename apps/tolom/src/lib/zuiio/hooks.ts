"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";

export interface FuzzySearchOptions {
  keys: (string | { name: string; weight: number })[];
  threshold?: number;
  prefix?: boolean;
  minQueryLength?: number;
  fuseOptions?: Record<string, unknown>;
  preserveOrderBelowMinLength?: boolean;
}

const DEFAULT_OPTIONS = {
  threshold: 0.4,
  prefix: false,
  minQueryLength: 0,
  preserveOrderBelowMinLength: true,
} as const;

export function useFuzzySearch<T>(
  items: T[],
  query: string,
  options: FuzzySearchOptions,
): T[] {
  const {
    keys,
    threshold = DEFAULT_OPTIONS.threshold,
    prefix = DEFAULT_OPTIONS.prefix,
    minQueryLength = DEFAULT_OPTIONS.minQueryLength,
    preserveOrderBelowMinLength = DEFAULT_OPTIONS.preserveOrderBelowMinLength,
    fuseOptions,
  } = options;

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys,
        threshold,
        isCaseSensitive: false,
        shouldSort: true,
        includeScore: true,
        ...(prefix ? { useTokenSearch: true } : {}),
        ...fuseOptions,
      }),
    [items, keys, threshold, prefix, fuseOptions],
  );

  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < minQueryLength) {
      return preserveOrderBelowMinLength ? [...items] : items;
    }
    return fuse.search(trimmed).map((result) => result.item);
  }, [fuse, items, minQueryLength, preserveOrderBelowMinLength, query]);
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return isOnline;
}
