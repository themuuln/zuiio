"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { UseFieldArrayRemove } from "react-hook-form";

/**
 * Returns a `removeRow` callback that removes the line item at `index`
 * and cleans up variantSelections + productQueries state.
 */
export function useVariantLineItemRemove<V>(
  remove: UseFieldArrayRemove,
  setVariantSelections: Dispatch<SetStateAction<Record<number, V>>>,
  setProductQueries?: Dispatch<SetStateAction<string[]>>,
) {
  return useCallback(
    (index: number) => {
      remove(index);
      setVariantSelections((prev) => {
        const next = { ...prev };
        delete next[index];
        const reindexed: Record<number, V> = {};
        for (const [key, val] of Object.entries(next)) {
          const k = Number(key);
          reindexed[k > index ? k - 1 : k] = val;
        }
        return reindexed;
      });
      setProductQueries?.((prev) => prev.filter((_, i) => i !== index));
    },
    [remove, setVariantSelections, setProductQueries],
  );
}
