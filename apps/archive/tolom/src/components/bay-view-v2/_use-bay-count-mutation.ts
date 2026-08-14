"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseBayCountMutationParams {
  currentBayCount: number;
  onApply: (next: number) => Promise<void>;
  onRefetch: () => Promise<void>;
}

/**
 * Encapsulates the bay count change flow: committed input → mutate → refetch.
 * Owns the input value, pending state, and in-flight guard ref.
 */
export function useBayCountMutation({
  currentBayCount,
  onApply,
  onRefetch,
}: UseBayCountMutationParams) {
  const [inputValue, setInputValue] = useState<number | string>(
    currentBayCount,
  );
  const [pending, setPending] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    setInputValue(currentBayCount);
  }, [currentBayCount]);

  const apply = useCallback(
    async (next: number) => {
      if (next === currentBayCount) return;
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setPending(true);

      try {
        await onApply(next);
        await onRefetch();
      } finally {
        inFlightRef.current = false;
        setPending(false);
      }
    },
    [currentBayCount, onApply, onRefetch],
  );

  return {
    inputValue,
    setInputValue,
    pending,
    apply,
    inFlightRef,
  } as const;
}
