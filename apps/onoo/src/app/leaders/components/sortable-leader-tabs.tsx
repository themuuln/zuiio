"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Versioned schema
// ---------------------------------------------------------------------------

interface StoredOrder {
  /** Schema version — bump to invalidate stale persisted orders. */
  v: number;
  /** Ordered stat keys. */
  keys: string[];
}

const STORAGE_KEY = "onoo-leader-order";
const SCHEMA_VERSION = 1;
const DEFAULT_KEYS = ["pts", "reb", "ast", "stl", "blk"] as const;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: "pts", label: "Оноо" },
  { key: "reb", label: "Самбар" },
  { key: "ast", label: "Дамжуулалт" },
  { key: "stl", label: "Бөмбөг таслалт" },
  { key: "blk", label: "Хаалт" },
] as const;

type Category = (typeof CATEGORIES)[number];

// ---------------------------------------------------------------------------
// SSR-safe storage helpers
// ---------------------------------------------------------------------------

function loadOrder(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOrder;
    if (
      parsed.v === SCHEMA_VERSION &&
      Array.isArray(parsed.keys) &&
      parsed.keys.length === DEFAULT_KEYS.length
    ) {
      // Validate every key is a known category
      const valid = new Set(DEFAULT_KEYS);
      if (parsed.keys.every((k) => valid.has(k))) {
        return parsed.keys;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function saveOrder(keys: string[]) {
  if (typeof window === "undefined") return;
  try {
    const data: StoredOrder = { v: SCHEMA_VERSION, keys };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SortableLeaderTabsProps {
  activeStatKey: string;
  competitionId: string | undefined;
  className?: string;
}

// ---------------------------------------------------------------------------
// Single sortable tab
// ---------------------------------------------------------------------------

function SortableTab({
  item,
  isActive,
  onClick,
}: {
  item: Category;
  isActive: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group inline-flex items-center gap-1 rounded-[min(var(--radius-md),12px)] px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-background hover:bg-muted",
        isDragging && "opacity-50 shadow-lg",
      )}
      role="tab"
      aria-selected={isActive}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground/50 transition-colors group-hover:text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label={`${item.label} чирэх`}
      >
        <GripVertical className="size-3" aria-hidden="true" />
      </button>
      <button type="button" onClick={onClick} className="whitespace-nowrap">
        {item.label}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SortableLeaderTabs({
  activeStatKey,
  competitionId,
  className,
}: SortableLeaderTabsProps) {
  const router = useRouter();
  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // --- PointerSensor with 8px activation distance ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // --- Load stored order on mount (SSR guard) ---
  useEffect(() => {
    const stored = loadOrder();
    setOrderedKeys(stored ?? [...DEFAULT_KEYS]);
    setHydrated(true);
  }, []);

  // --- Build ordered items, falling back to default until hydrated ---
  const catMap = useMemo(
    () => new Map<string, Category>(CATEGORIES.map((c) => [c.key, c])),
    [],
  );

  const items = useMemo(() => {
    const source = hydrated ? orderedKeys : DEFAULT_KEYS;
    const result: Category[] = [];
    for (const key of source) {
      const item = catMap.get(key);
      if (item) result.push(item);
    }
    return result;
  }, [orderedKeys, hydrated, catMap]);

  // --- Tab click handler — navigates to new stat ---
  const handleSelect = useCallback(
    (key: string) => {
      const params = new URLSearchParams();
      params.set("stat", key);
      if (competitionId) {
        params.set("competition", competitionId);
      }
      router.push(`/leaders?${params.toString()}`);
    },
    [router, competitionId],
  );

  // --- Drag end handler ---
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = orderedKeys.indexOf(String(active.id));
      const newIndex = orderedKeys.indexOf(String(over.id));

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(orderedKeys, oldIndex, newIndex);
      setOrderedKeys(newOrder);
      saveOrder(newOrder);
    },
    [orderedKeys],
  );

  if (items.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.key)}
        strategy={horizontalListSortingStrategy}
      >
        <nav
          aria-label="Үзүүлэлт сонгох"
          className={cn("flex flex-wrap gap-2", className)}
        >
          {items.map((item) => (
            <SortableTab
              key={item.key}
              item={item}
              isActive={item.key === activeStatKey}
              onClick={() => handleSelect(item.key)}
            />
          ))}
        </nav>
      </SortableContext>
    </DndContext>
  );
}
