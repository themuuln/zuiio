"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseBayCountMutationParams {
  currentBayCount: number;
  onApply: (next: number) => Promise<void>;
  onRefetch: () => Promise<void>;
}

/**
 * Encapsulates the bay count change flow: debounced input → confirm → mutate → refetch.
 * Owns the input value, pending state, and debounce ref.
 */
export function useBayCountMutation({
  currentBayCount,
  onApply,
  onRefetch,
}: UseBayCountMutationParams) {
  const [inputValue, setInputValue] = useState<number | string>("");
  const [pending, setPending] = useState(false);
  const inFlightRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(currentBayCount);

  // Sync input when bay count changes from server
  useEffect(() => {
    setInputValue(currentBayCount);
  }, [currentBayCount]);

  useEffect(() => {
    valueRef.current = currentBayCount;
  }, [currentBayCount]);

  const apply = useCallback(
    async (next: number) => {
      if (next === currentBayCount) return;
      if (inFlightRef.current) return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      inFlightRef.current = true;
      valueRef.current = next;
      setPending(true);
      let caught: unknown = null;
      try {
        await onApply(next);
        await onRefetch();
      } catch (err) {
        caught = err;
      }
      inFlightRef.current = false;
      setPending(false);
      if (caught) throw caught;
    },
    [currentBayCount, onApply, onRefetch],
  );

  return {
    inputValue,
    setInputValue,
    pending,
    apply,
    debounceRef,
    valueRef,
  } as const;
}
