"use client";

import {
  type ReactVirtualizer,
  useVirtualizer,
  type VirtualItem,
} from "@tanstack/react-virtual";
import { useRef } from "react";
import { useNoMemo } from "./use-no-memo";

export interface UseVirtualListOptions<T> {
  items: T[];
  estimatedItemHeight?: number;
  overscan?: number;
}

interface UseVirtualListResult<_T> {
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: ReactVirtualizer<HTMLDivElement, Element>;
  virtualItems: VirtualItem[];
  totalSize: number;
}

export function useVirtualList<T>({
  items,
  estimatedItemHeight = 48,
  overscan = 5,
}: UseVirtualListOptions<T>): UseVirtualListResult<T> {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
  });

  const virtualItems = useNoMemo(() => virtualizer.getVirtualItems());

  return {
    parentRef,
    virtualizer,
    virtualItems,
    totalSize: virtualizer.getTotalSize(),
  };
}
