"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Search, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import {
  type SortableItem,
  SortableListBody,
} from "@/components/sortable-list";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface Mechanic extends SortableItem {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  current_jobs?: number;
}

interface MechanicQuickAssignProps {
  currentMechanic?: Mechanic | null;
  hasLeadMechanic?: boolean;
  helperMechanics?: Mechanic[];
  mechanics: Mechanic[];
  onAssignLead: (mechanicId: string) => Promise<void>;
  onAssignHelper: (mechanicId: string) => Promise<void>;
  onUnassign?: (mechanicId: string) => Promise<void>;
  onReorder?: (orderedMechanicIds: string[]) => Promise<void>;
  disabled?: boolean;
}

function SortableMechanicRow({
  mechanic,
  isAssigned,
  isLead,
  onToggle,
}: {
  mechanic: Mechanic;
  isAssigned: boolean;
  isLead: boolean;
  onToggle?: (mechanicId: string) => void;
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
        "flex items-center gap-1 rounded-md px-1 py-1",
        isDragging && "opacity-50 bg-accent/30 shadow-sm",
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="flex size-5 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded hover:bg-muted/60 active:cursor-grabbing"
      >
        <GripVertical className="size-3 text-muted-foreground/30" />
      </span>
      <Checkbox
        checked={isAssigned}
        onCheckedChange={() => onToggle?.(mechanic.id)}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="size-4 shrink-0"
        aria-label={`Toggle ${mechanic.full_name ?? "mechanic"}`}
      />
      <MechanicAvatar mechanic={mechanic} className="size-6 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {mechanic.full_name ?? "Unknown"}
      </span>
      {isLead && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          Lead
        </span>
      )}
      {isAssigned && !isLead && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
          Helper
        </span>
      )}
    </div>
  );
}

export function MechanicQuickAssign({
  currentMechanic,
  mechanics,
  hasLeadMechanic = false,
  helperMechanics = [],
  onAssignLead,
  onAssignHelper,
  onUnassign,
  onReorder,
  disabled = false,
}: MechanicQuickAssignProps) {
  const t = useTranslations("bayView");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Local optimistic set of assigned mechanic IDs — merges with server props
  // so checkbox toggle updates the UI immediately even if the parent
  // doesn't re-render into the open portal.
  const [localAssignedIds, setLocalAssignedIds] = useState<Set<string> | null>(
    null,
  );

  // Sync local state with server when popover opens
  useEffect(() => {
    if (open) setLocalAssignedIds(null);
  }, [open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const serverAssignedIds = useMemo(
    () =>
      new Set([
        ...(currentMechanic ? [currentMechanic.id] : []),
        ...helperMechanics.map((m) => m.id),
      ]),
    [currentMechanic, helperMechanics],
  );

  // Sync local with server when popover opens, then let local take over
  const effectiveAssignedIds = localAssignedIds ?? serverAssignedIds;

  // Preserve order: [lead, ...helpers], but only include mechanics still in the effective set
  const assignedMechanics = useMemo(() => {
    const ordered = [];
    if (currentMechanic && effectiveAssignedIds.has(currentMechanic.id)) {
      ordered.push(currentMechanic);
    }
    for (const h of helperMechanics) {
      if (effectiveAssignedIds.has(h.id)) {
        ordered.push(h);
      }
    }
    return ordered;
  }, [currentMechanic, helperMechanics, effectiveAssignedIds]);

  const allItems = useMemo(() => {
    const assignedIds = new Set(assignedMechanics.map((m) => m.id));
    return [
      ...assignedMechanics,
      ...mechanics.filter((m) => !assignedIds.has(m.id)),
    ];
  }, [assignedMechanics, mechanics]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);
      if (!over || active.id === over.id) return;

      const oldIndex = allItems.findIndex((m) => m.id === active.id);
      const newIndex = allItems.findIndex((m) => m.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const assignedCount = assignedMechanics.length;
      const wasUnassigned = oldIndex >= assignedCount;
      const isNowAssigned = newIndex < assignedCount;

      if (wasUnassigned && isNowAssigned) {
        setLocalAssignedIds((prev) => {
          const base = prev ?? serverAssignedIds;
          const next = new Set(base);
          next.add(String(active.id));
          return next;
        });
        setOpen(false);
        setSearch("");
        if (!hasLeadMechanic && newIndex === 0) {
          onAssignLead(String(active.id)).catch(() => {});
        } else {
          onAssignHelper(String(active.id)).catch(() => {});
        }
      } else if (!wasUnassigned && isNowAssigned && onReorder) {
        const reordered = arrayMove(allItems, oldIndex, newIndex);
        setOpen(false);
        setSearch("");
        onReorder(reordered.slice(0, assignedCount).map((m) => m.id)).catch(
          () => {},
        );
      } else if (!wasUnassigned && !isNowAssigned && onUnassign) {
        setLocalAssignedIds((prev) => {
          const base = prev ?? serverAssignedIds;
          const next = new Set(base);
          next.delete(String(active.id));
          return next;
        });
        setOpen(false);
        setSearch("");
        onUnassign(String(active.id)).catch(() => {});
      }
    },
    [
      allItems,
      assignedMechanics.length,
      serverAssignedIds,
      hasLeadMechanic,
      onAssignLead,
      onAssignHelper,
      onUnassign,
      onReorder,
    ],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveDragId(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "flex size-6 items-center justify-center rounded-full border border-dashed transition-all duration-200",
                "text-muted-foreground/40 hover:text-primary hover:border-primary/50 hover:bg-primary/10",
                "active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
              )}
            >
              <UserPlus className="size-3" />
            </button>
          }
        />
        <PopoverContent
          className="w-72 p-0"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
              <Typography.Text className="text-xs font-semibold">
                {hasLeadMechanic
                  ? "Add Helper"
                  : currentMechanic
                    ? "Change Mechanic"
                    : "Assign Mechanic"}
              </Typography.Text>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-border/50 px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40" />
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchMechanics")}
                  className="h-7 pl-7 pr-2 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearch("");
                      setOpen(false);
                    }
                  }}
                />
              </div>
            </div>

            <SortableListBody
              items={mechanics}
              assignedItems={assignedMechanics}
              search={search}
              searchPredicate={(m, q) =>
                (m.full_name?.toLowerCase().includes(q) ?? false) ||
                m.id.toLowerCase().includes(q)
              }
              emptyText={t("allMechanicsAssigned") ?? "All mechanics assigned"}
              noResultsText={t("noMechanicsFound") ?? "No mechanics found"}
              renderItem={(m, { isAssigned, isLead }) => (
                <SortableMechanicRow
                  mechanic={m as Mechanic}
                  isAssigned={isAssigned}
                  isLead={isLead}
                  onToggle={(id) => {
                    setLocalAssignedIds((prev) => {
                      const base = prev ?? serverAssignedIds;
                      const next = new Set(base);
                      if (isAssigned) {
                        next.delete(id);
                      } else {
                        next.add(id);
                      }
                      return next;
                    });
                    if (isAssigned) {
                      onUnassign?.(id).catch(() => {});
                    } else if (!hasLeadMechanic) {
                      onAssignLead(id).catch(() => {});
                    } else {
                      onAssignHelper(id).catch(() => {});
                    }
                  }}
                />
              )}
            />
          </div>
        </PopoverContent>

        <DragOverlay>
          {(() => {
            if (!activeDragId) return null;
            const dragged = allItems.find((m) => m.id === activeDragId);
            if (!dragged) return null;
            return (
              <div className="flex items-center gap-2 rounded-md bg-card px-2 py-1.5 shadow-lg ring-1 ring-border/50">
                <GripVertical className="size-3 text-muted-foreground/30" />
                <MechanicAvatar mechanic={dragged} className="size-6" />
                <span className="text-xs font-medium">{dragged.full_name}</span>
              </div>
            );
          })()}
        </DragOverlay>
      </DndContext>
    </Popover>
  );
}
