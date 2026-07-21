"use client";

import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { useNoMemo } from "./use-no-memo";

interface UseInfiniteVirtualOptions<T> {
  items: T[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  estimatedItemHeight?: number;
  overscan?: number;
  sentinelThreshold?: number;
  _sentinelThreshold?: number;
}

interface UseInfiniteVirtualResult {
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualItems: VirtualItem[];
  totalSize: number;
}

export function useInfiniteVirtual<T>({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  estimatedItemHeight = 64,
  overscan = 5,
  _sentinelThreshold = 3,
}: UseInfiniteVirtualOptions<T>): UseInfiniteVirtualResult {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length + (hasNextPage ? 1 : 0), // +1 for sentinel
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
  });

  const virtualItems = useNoMemo(() => virtualizer.getVirtualItems());

  // Trigger fetch when sentinel row becomes visible
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (lastItem.index >= items.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    items.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  return {
    parentRef,
    virtualItems,
    totalSize: virtualizer.getTotalSize(),
  };
}
