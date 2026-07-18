"use client";

import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SortableTabItem {
  key: string;
  label: string;
}

interface SortableTabsProps {
  /** Ordered list of tab items. */
  items: SortableTabItem[];
  /** Currently active tab key. */
  activeKey: string;
  /** Called when tab is selected. */
  onSelect: (key: string) => void;
  /** Called when order changes (saves to localStorage). */
  onReorder: (items: SortableTabItem[]) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Single sortable tab
// ---------------------------------------------------------------------------

function SortableTab({
  item,
  isActive,
  onSelect,
}: {
  item: SortableTabItem;
  isActive: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground/50 transition-colors group-hover:text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label={`${item.label} жагсаалтад чирэх`}
      >
        <GripVertical className="size-3" aria-hidden="true" />
      </button>
      <button type="button" onClick={onSelect} className="whitespace-nowrap">
        {item.label}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storage helper
// ---------------------------------------------------------------------------

const STORAGE_KEY = "onoo-leader-tab-order";

function loadOrder(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : null;
  } catch {
    return null;
  }
}

function saveOrder(keys: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Reorderable leader category tabs.
 *
 * Drag the grip handle to reorder tab categories.
 * Order persists in localStorage.
 * Falls back to click for keyboard/accessibility.
 */
export function SortableTabs({
  items,
  activeKey,
  onSelect,
  onReorder,
  className,
}: SortableTabsProps) {
  const [orderedItems, setOrderedItems] = useState(items);

  // Apply stored order on mount
  useEffect(() => {
    const storedOrder = loadOrder();
    if (storedOrder && storedOrder.length === items.length) {
      const reordered = storedOrder
        .map((key) => items.find((item) => item.key === key))
        .filter(Boolean) as SortableTabItem[];
      if (reordered.length === items.length) {
        setOrderedItems(reordered);
      }
    } else {
      setOrderedItems(items);
    }
  }, [items]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = orderedItems.findIndex((item) => item.key === active.id);
      const newIndex = orderedItems.findIndex((item) => item.key === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
      setOrderedItems(newOrder);
      saveOrder(newOrder.map((item) => item.key));
      onReorder(newOrder);
    },
    [orderedItems, onReorder],
  );

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={orderedItems.map((item) => item.key)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          className={cn("flex gap-1 overflow-x-auto pb-1", className)}
          role="tablist"
          aria-label="Ангилал сонгох (чирч эрэмбэлнэ)"
        >
          {orderedItems.map((item) => (
            <SortableTab
              key={item.key}
              item={item}
              isActive={item.key === activeKey}
              onSelect={() => onSelect(item.key)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
