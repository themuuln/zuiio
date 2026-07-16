"use client";

import type { ReactNode } from "react";
import {
  type UseVirtualListOptions,
  useVirtualList,
} from "@/hooks/use-virtual-list";
import { cn } from "@/lib/utils";

interface VirtualListProps<T> extends UseVirtualListOptions<T> {
  className?: string;
  children: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
}

export function VirtualList<T>({
  items,
  estimatedItemHeight = 48,
  overscan = 5,
  className,
  children,
  emptyState,
}: VirtualListProps<T>) {
  const { parentRef, virtualItems, totalSize } = useVirtualList({
    items,
    estimatedItemHeight,
    overscan,
  });

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: Virtual list needs div for absolute positioning
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-rowcount is valid for virtual lists
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      role="list"
      aria-rowcount={items.length}
    >
      <div style={{ height: `${totalSize}px`, position: "relative" }}>
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          if (item === undefined) return null;

          return (
            // biome-ignore lint/a11y/useSemanticElements: Virtual list needs div for absolute positioning
            // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-rowindex is valid for virtual lists
            <div
              key={virtualRow.key}
              role="listitem"
              aria-rowindex={virtualRow.index + 1}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {children(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
