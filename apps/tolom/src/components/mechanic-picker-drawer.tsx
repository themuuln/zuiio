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
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

export interface MechanicItem {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  current_jobs?: number;
}

export interface MechanicPickerDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Called when the drawer should open or close */
  onOpenChange: (open: boolean) => void;
  /** All available mechanics to pick from */
  mechanics: MechanicItem[];
  /** Currently selected mechanic IDs, in order */
  selectedIds: string[];
  /** Called when a mechanic is checked or unchecked */
  onSelectionChange: (ids: string[]) => void;
  /** Called when the order of selected mechanics changes via drag */
  onReorder?: (orderedIds: string[]) => void;
  /** ID of the lead mechanic — shows a "Lead" badge */
  leadId?: string | null;
  /** Custom labels */
  labels?: {
    title?: string;
    searchPlaceholder?: string;
    empty?: string;
    noResults?: string;
  };
}

// ─── Row ────────────────────────────────────────────────────────

function MechanicRow({
  mechanic,
  isSelected,
  isLead,
  onToggle,
}: {
  mechanic: MechanicItem;
  isSelected: boolean;
  isLead: boolean;
  onToggle?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mechanic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2",
        isDragging && "opacity-50 bg-accent/30 shadow-sm",
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="flex size-6 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded hover:bg-muted/60 active:cursor-grabbing"
      >
        <GripVertical className="size-3.5 text-muted-foreground/30" />
      </span>
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle?.(mechanic.id)}
        className="size-5 shrink-0"
        aria-label={`Toggle ${mechanic.full_name ?? "mechanic"}`}
      />
      <MechanicAvatar mechanic={mechanic} className="size-7 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {mechanic.full_name ?? "Unknown"}
      </span>
      {isLead && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          Lead
        </span>
      )}
      {isSelected && !isLead && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-500/12 px-1.5 py-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
          Helper
        </span>
      )}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

export function MechanicPickerDrawer({
  open,
  onOpenChange,
  mechanics,
  selectedIds,
  onSelectionChange,
  onReorder,
  leadId,
  labels,
}: MechanicPickerDrawerProps) {
  const [search, setSearch] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return mechanics;
    return mechanics.filter(
      (m) =>
        (m.full_name?.toLowerCase().includes(q) ?? false) ||
        m.id.toLowerCase().includes(q),
    );
  }, [mechanics, search]);

  // Ordered: selected items first (preserving order), then unselected + filtered
  const ordered = useMemo(() => {
    const selected = selectedIds
      .map((id) => mechanics.find((m) => m.id === id))
      .filter(
        (m): m is MechanicItem => !!m && filtered.some((f) => f.id === m.id),
      );
    const unselected = filtered.filter((m) => !selectedSet.has(m.id));
    return [...selected, ...unselected];
  }, [mechanics, selectedIds, filtered, selectedSet]);

  // Reset search on close
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setSearch("");
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);
      if (!over || active.id === over.id) return;

      const oldIndex = ordered.findIndex((m) => m.id === active.id);
      const newIndex = ordered.findIndex((m) => m.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const selectedCount = selectedIds.length;
      const wasUnselected = oldIndex >= selectedCount;
      const isNowSelected = newIndex < selectedCount;

      if (wasUnselected && isNowSelected) {
        // Drag from unselected into selected: add at position
        const ids = [...selectedIds];
        ids.splice(newIndex, 0, String(active.id));
        onSelectionChange(ids);
      } else if (!wasUnselected && isNowSelected && onReorder) {
        // Reorder within selected
        const reordered = selectedIds.slice();
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        onReorder(reordered);
      } else if (!wasUnselected && !isNowSelected) {
        // Drag from selected into unselected: remove
        onSelectionChange(selectedIds.filter((id) => id !== active.id));
      }
    },
    [ordered, selectedIds, onSelectionChange, onReorder],
  );

  const handleToggle = useCallback(
    (id: string) => {
      const isSelected = selectedSet.has(id);
      const newSelected = isSelected
        ? selectedIds.filter((sid) => sid !== id)
        : [...selectedIds, id];
      onSelectionChange(newSelected);
    },
    [selectedIds, selectedSet, onSelectionChange],
  );

  const title = labels?.title ?? "Assign Mechanic";
  const searchPlaceholder = labels?.searchPlaceholder ?? "Search mechanics...";
  const emptyText = labels?.empty ?? "All mechanics assigned";
  const noResultsText = labels?.noResults ?? "No mechanics found";

  const showEmpty = ordered.length === 0 && !search;
  const showNoResults = ordered.length === 0 && search.length > 0;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveDragId(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <DrawerContent
          showCloseButton={false}
          className="sm:max-w-sm"
          contentClassName="flex flex-col p-0 gap-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 shrink-0">
            <Typography.Text className="text-sm font-semibold">
              {title}
            </Typography.Text>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-border/50 px-4 py-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pl-7 pr-2 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearch("");
                  }
                }}
              />
            </div>
          </div>

          {/* Scrollable mechanic list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <SortableContext
              items={ordered.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {showEmpty || showNoResults ? (
                <div className="px-3 py-8 text-center">
                  <Typography.Text className="text-xs text-muted-foreground">
                    {showNoResults ? noResultsText : emptyText}
                  </Typography.Text>
                </div>
              ) : (
                ordered.map((m) => (
                  <MechanicRow
                    key={m.id}
                    mechanic={m}
                    isSelected={selectedSet.has(m.id)}
                    isLead={m.id === leadId}
                    onToggle={handleToggle}
                  />
                ))
              )}
            </SortableContext>
          </div>
        </DrawerContent>

        <DragOverlay>
          {(() => {
            if (!activeDragId) return null;
            const dragged = ordered.find((m) => m.id === activeDragId);
            if (!dragged) return null;
            return (
              <div className="flex items-center gap-2 rounded-md bg-card px-2 py-1.5 shadow-lg ring-1 ring-border/50">
                <GripVertical className="size-3.5 text-muted-foreground/30" />
                <MechanicAvatar mechanic={dragged} className="size-6" />
                <span className="text-xs font-medium">{dragged.full_name}</span>
              </div>
            );
          })()}
        </DragOverlay>
      </DndContext>
    </Drawer>
  );
}
