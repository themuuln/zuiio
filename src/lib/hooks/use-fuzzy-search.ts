import Fuse from "fuse.js";
import { useMemo } from "react";

export interface FuzzySearchOptions {
  /** Keys to search over: key names, dotted nested paths, or { name, weight } objects. */
  keys: (string | { name: string; weight: number })[];
  /** Match threshold: 0.0 (exact) to 1.0 (match anything). Default 0.4 */
  threshold?: number;
  /** If true, prefix matching only (faster). Default false */
  prefix?: boolean;
  /** Minimum query length to trigger search. Default 0 (always search) */
  minQueryLength?: number;
  /** Additional fuse.js options */
  fuseOptions?: Record<string, unknown>;
  /** Keep original order when query is too short instead of fuzzy sorting */
  preserveOrderBelowMinLength?: boolean;
}

const DEFAULT_OPTIONS = {
  threshold: 0.4,
  prefix: false,
  minQueryLength: 0,
  preserveOrderBelowMinLength: true,
} as const;

/**
 * Client-side fuzzy search hook powered by Fuse.js.
 *
 * Returns memoized results that update when items, query, or options change.
 *
 * @example
 * ```ts
 * const filtered = useFuzzySearch(allItems, {
 *   query: searchQuery,
 *   keys: ["name", "category"],
 * });
 * ```
 */
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
      ...(prefix ? { tokenize: true, matchAllTokens: true } : {}),
      ...fuseOptions,
    });
  }, [items, keys, threshold, prefix, fuseOptions]);

  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < minQueryLength) {
      return preserveOrderBelowMinLength ? items : [...items];
    }

    const result = fuse.search(trimmed);
    return result.map((r) => r.item);
  }, [fuse, items, query, minQueryLength, preserveOrderBelowMinLength]);
}
