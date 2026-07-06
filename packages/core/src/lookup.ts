/**
 * Reusable Map-based lookup utilities for replacing O(n) Array.find()
 * with O(1) Map.get() in hot paths.
 *
 * Common patterns replaced:
 *   items.find(i => i.id === targetId)          → lookup.get(targetId)
 *   items.filter(i => i.x === val).length        → aggregated.get(val)
 */

// ── createLookup ──────────────────────────────────────────────────────

export function createLookup<T, K>(
  items: T[],
  keyFn: (item: T) => K | null | undefined,
  options?: { skipNull?: boolean },
): Map<K, T>;
export function createLookup<T, K, V>(
  items: T[],
  keyFn: (item: T) => K | null | undefined,
  valueFn: (item: T) => V,
  options?: { skipNull?: boolean },
): Map<K, V>;
export function createLookup<T, K, V = T>(
  items: T[],
  keyFn: (item: T) => K | null | undefined,
  valueFnOrOptions?: ((item: T) => V) | { skipNull?: boolean },
  options?: { skipNull?: boolean },
): Map<K, V> {
  const valueFn: (item: T) => V =
    typeof valueFnOrOptions === "function"
      ? valueFnOrOptions
      : (item: T) => item as unknown as V;

  const skipNull =
    typeof valueFnOrOptions === "object"
      ? valueFnOrOptions.skipNull
      : options?.skipNull;

  const map = new Map<K, V>();
  for (const item of items) {
    const key = keyFn(item);
    if (key != null || !skipNull) {
      map.set(key as K, valueFn(item));
    }
  }
  return map;
}

// ── createAggregatedLookup ────────────────────────────────────────────

/**
 * Creates a Map<Key, number> by aggregating numeric values from an array.
 * Defaults to summing values; pass `count` aggregate for simple counting.
 *
 * @example
 * // Sum quantities by productId (for cart badge)
 * const qtys = createAggregatedLookup(cartItems, i => i.productId, i => i.quantity);
 *
 * // Count items by category
 * const counts = createAggregatedLookup(products, p => p.category_id, () => 1);
 */
export function createAggregatedLookup<T, K>(
  items: T[],
  keyFn: (item: T) => K | null | undefined,
  valueFn: (item: T) => number,
): Map<K, number> {
  const map = new Map<K, number>();
  for (const item of items) {
    const key = keyFn(item);
    if (key == null) continue;
    map.set(key, (map.get(key) ?? 0) + valueFn(item));
  }
  return map;
}
