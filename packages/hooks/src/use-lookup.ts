import { createAggregatedLookup, createLookup } from "@zuiio/core";
import { useMemo } from "react";

/**
 * Memoized Map lookup — replaces O(n) Array.find() with O(1) Map.get().
 *
 * @example
 * // Before: products.find(p => p.barcode === scanned)
 * // After:  lookup.get(scanned)
 * const barcodeMap = useLookup(products, p => p.barcode?.toLowerCase());
 *
 * @example
 * // With value transform (extract just the price)
 * const priceMap = useLookup(products, p => p.id, p => p.sale_price);
 */
export function useLookup<T, K>(
  items: T[],
  keyFn: (item: T) => K | null | undefined,
  options?: { skipNull?: boolean },
): Map<K, T>;
export function useLookup<T, K, V>(
  items: T[],
  keyFn: (item: T) => K | null | undefined,
  valueFn: (item: T) => V,
  options?: { skipNull?: boolean },
): Map<K, V>;
export function useLookup<T, K, V = T>(
  items: T[],
  keyFn: (item: T) => K | null | undefined,
  valueFnOrOptions?: ((item: T) => V) | { skipNull?: boolean },
  options?: { skipNull?: boolean },
): Map<K, V> {
  const valueFn: ((item: T) => V) | undefined =
    typeof valueFnOrOptions === "function" ? valueFnOrOptions : undefined;
  const skipNull =
    typeof valueFnOrOptions === "object"
      ? valueFnOrOptions.skipNull
      : options?.skipNull;

  return useMemo(
    () =>
      valueFn
        ? createLookup(items, keyFn, valueFn, { skipNull })
        : (createLookup(items, keyFn, { skipNull }) as unknown as Map<K, V>),
    [items, keyFn, valueFn, skipNull],
  );
}

/**
 * Memoized aggregated Map — sums/counts numeric values by key.
 *
 * @example
 * // Cart quantity per product
 * const qtys = useAggregatedLookup(items, i => i.productId, i => i.quantity);
 *
 * @example
 * // Count items per category
 * const counts = useAggregatedLookup(products, p => p.category_id, () => 1);
 */
export function useAggregatedLookup<T, K>(
  items: T[],
  keyFn: (item: T) => K | null | undefined,
  valueFn: (item: T) => number,
): Map<K, number> {
  return useMemo(
    () => createAggregatedLookup(items, keyFn, valueFn),
    [items, keyFn, valueFn],
  );
}
