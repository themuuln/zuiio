import Fuse from "fuse.js";
import { useMemo } from "react";

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

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys,
      threshold,
      isCaseSensitive: false,
      shouldSort: true,
      includeScore: true,
      ...(prefix ? { useTokenSearch: true } : {}),
      ...fuseOptions,
    });
  }, [items, keys, threshold, prefix, fuseOptions]);

  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < minQueryLength) {
      return [...items];
    }
    const result = fuse.search(trimmed);
    return result.map((r) => r.item);
  }, [fuse, items, query, minQueryLength]);
}
