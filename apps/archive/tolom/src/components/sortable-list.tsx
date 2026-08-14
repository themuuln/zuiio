"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

export interface SortableItem {
  id: string;
}

export interface ItemRenderArgs {
  index: number;
  isAssigned: boolean;
  isLead: boolean;
}

// ── SortableListBody ──────────────────────────────────────────
// Renders the sortable list content inside a SortableContext.
// Does NOT include DndContext or DragOverlay — place those at a
// parent level so DragOverlay can sit outside portal boundaries.

interface SortableListBodyProps<T extends SortableItem> {
  items: T[];
  assignedItems: T[];
  renderItem: (item: T, args: ItemRenderArgs) => React.ReactNode;
  search?: string;
  searchPredicate?: (item: T, search: string) => boolean;
  emptyText?: string;
  noResultsText?: string;
}

export function SortableListBody<T extends SortableItem>({
  items,
  assignedItems,
  renderItem,
  search,
  searchPredicate,
  emptyText = "No items",
  noResultsText = "No results found",
}: SortableListBodyProps<T>) {
  const assignedIds = useMemo(
    () => new Set(assignedItems.map((m) => m.id)),
    [assignedItems],
  );

  const filtered = useMemo(() => {
    const q = (search ?? "").toLowerCase();
    if (!q) return items;
    if (searchPredicate) {
      return items.filter((m) => searchPredicate(m, q));
    }
    return items.filter((m) => JSON.stringify(m).toLowerCase().includes(q));
  }, [items, search, searchPredicate]);

  const unassignedItems = useMemo(
    () => filtered.filter((m) => !assignedIds.has(m.id)),
    [filtered, assignedIds],
  );

  const allItems = useMemo(
    () => [...assignedItems, ...unassignedItems],
    [assignedItems, unassignedItems],
  );

  const showUnassigned = unassignedItems.length > 0;

  return (
    <SortableContext
      items={allItems.map((m) => m.id)}
      strategy={verticalListSortingStrategy}
    >
      {showUnassigned || assignedItems.length > 0 ? (
        <div className="max-h-[300px] overflow-y-auto no-scrollbar">
          {assignedItems.map((m, i) => (
            <div key={m.id}>
              {renderItem(m, {
                index: i,
                isAssigned: true,
                isLead: i === 0,
              })}
            </div>
          ))}

          {unassignedItems.map((m) => (
            <div key={m.id}>
              {renderItem(m, {
                index: assignedItems.length + unassignedItems.indexOf(m),
                isAssigned: false,
                isLead: false,
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            {search ? noResultsText : emptyText}
          </p>
        </div>
      )}
    </SortableContext>
  );
}

// ── SortableList ──────────────────────────────────────────────
// Full convenience wrapper with DndContext + DragOverlay.
// Use this when NOT inside a popover/portal boundary.

interface SortableListProps<T extends SortableItem> {
  items: T[];
  assignedItems: T[];
  renderItem: (item: T, args: ItemRenderArgs) => React.ReactNode;
  renderDragOverlay: (item: T) => React.ReactNode;
  searchPredicate?: (item: T, search: string) => boolean;
  search?: string;
  emptyText?: string;
  noResultsText?: string;
  onAssignFromDrop?: (itemId: string, dropIndex: number) => void;
  onReorder?: (orderedIds: string[]) => void;
  activationDistance?: number;
}

export function SortableList<T extends SortableItem>({
  items,
  assignedItems,
  renderItem,
  renderDragOverlay,
  searchPredicate,
  emptyText,
  noResultsText,
  onAssignFromDrop,
  onReorder,
  activationDistance = 4,
  search,
}: SortableListProps<T>) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: activationDistance },
    }),
  );

  const allItems = useMemo(
    () => [
      ...assignedItems,
      ...items.filter((m) => !assignedItems.some((a) => a.id === m.id)),
    ],
    [assignedItems, items],
  );

  const assignedCount = assignedItems.length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = allItems.findIndex((m) => m.id === active.id);
    const newIndex = allItems.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const wasUnassigned = oldIndex >= assignedCount;
    const isNowAssigned = newIndex < assignedCount;

    if (wasUnassigned && isNowAssigned) {
      onAssignFromDrop?.(String(active.id), newIndex);
    } else if (!wasUnassigned && onReorder) {
      const reordered = arrayMove(allItems, oldIndex, newIndex);
      onReorder(reordered.slice(0, assignedCount).map((m) => m.id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveDragId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragId(null)}
    >
      <SortableListBody
        items={items}
        assignedItems={assignedItems}
        renderItem={renderItem}
        search={search}
        searchPredicate={searchPredicate}
        emptyText={emptyText}
        noResultsText={noResultsText}
      />

      <DragOverlay>
        {(() => {
          if (!activeDragId) return null;
          const dragged = allItems.find((m) => m.id === activeDragId);
          if (!dragged) return null;
          return renderDragOverlay(dragged);
        })()}
      </DragOverlay>
    </DndContext>
  );
}
