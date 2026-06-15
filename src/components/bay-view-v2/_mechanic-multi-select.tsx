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
import { Crown, GripVertical, Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { MechanicAvatarGroup } from "@/components/mechanic-avatar-chip";
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
import { cn } from "@/lib/utils";

interface MechanicOption extends SortableItem {
  id: string;
  full_name: string;
  current_jobs?: number;
}

interface Helper {
  id: string;
  mechanic_id?: string;
  full_name?: string | null | undefined;
}

interface MechanicMultiSelectProps {
  leadMechanicId: string | null;
  leadMechanicName: string | null;
  helpers: Helper[];
  mechanics: MechanicOption[];
  orgId: string;
  workOrderId: string;
  saving: boolean;
  onLeadChange: (mechanicId: string) => void;
  onHelpersChange: () => void;
}

function SortableMechanicRow({
  mechanic,
  isAssigned,
  isLead,
  onToggle,
}: {
  mechanic: MechanicOption;
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
        "flex items-center gap-2 rounded-lg px-2.5 py-2.5",
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
        aria-label={`Toggle ${mechanic.full_name}`}
      />
      <MechanicAvatar mechanic={mechanic} className="size-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{mechanic.full_name}</div>
        {mechanic.current_jobs !== undefined && (
          <div className="text-[10px] text-muted-foreground">
            {mechanic.current_jobs > 0
              ? `${mechanic.current_jobs} active jobs`
              : "Available"}
          </div>
        )}
      </div>
      {isLead && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/12 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <Crown className="size-3" />
          Lead
        </span>
      )}
    </div>
  );
}

/** Build ordered value: [lead, ...helpers] */
function buildSelectedValue(
  leadMechanicId: string | null,
  helpers: Helper[],
  mechanics: MechanicOption[],
): MechanicOption[] {
  const result: MechanicOption[] = [];
  if (leadMechanicId) {
    const lead = mechanics.find((m) => m.id === leadMechanicId);
    if (lead) result.push(lead);
  }
  for (const h of helpers) {
    const hid = h.mechanic_id ?? h.id;
    if (hid === leadMechanicId) continue;
    const m = mechanics.find((mech) => mech.id === hid);
    if (m) result.push(m);
  }
  return result;
}

export function MechanicMultiSelect({
  leadMechanicId,
  leadMechanicName: _leadMechanicName,
  helpers,
  mechanics,
  orgId,
  workOrderId,
  saving,
  onLeadChange,
  onHelpersChange,
}: MechanicMultiSelectProps) {
  const t = useTranslations("bayView");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isMutatingMechanicId, setIsMutatingMechanicId] = useState<
    string | null
  >(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const serverValue = useMemo(
    () => buildSelectedValue(leadMechanicId, helpers, mechanics),
    [leadMechanicId, helpers, mechanics],
  );

  // Pessimistic local state: set AFTER API success, cleared when refetch arrives
  const [localValue, setLocalValue] = useState<MechanicOption[] | null>(null);
  const value = localValue ?? serverValue;

  // Sync: when server catches up, drop local
  useEffect(() => {
    if (!localValue) return;
    const localIds = localValue
      .map((m) => m.id)
      .sort()
      .join(",");
    const serverIds = serverValue
      .map((m) => m.id)
      .sort()
      .join(",");
    if (localIds === serverIds) setLocalValue(null);
  }, [localValue, serverValue]);

  // Reset search when popover opens
  useEffect(() => {
    if (!popoverOpen) setSearch("");
  }, [popoverOpen]);

  const allItems = useMemo(() => {
    const assignedIds = new Set(value.map((m) => m.id));
    return [...value, ...mechanics.filter((m) => !assignedIds.has(m.id))];
  }, [value, mechanics]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);
      if (!over || active.id === over.id) return;

      const oldIndex = allItems.findIndex((m) => m.id === active.id);
      const newIndex = allItems.findIndex((m) => m.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const assignedCount = value.length;
      const wasUnassigned = oldIndex >= assignedCount;
      const isNowAssigned = newIndex < assignedCount;

      if (wasUnassigned && isNowAssigned) {
        if (newIndex === 0) {
          // Assign as lead
          onLeadChange(String(active.id));
          const candidate = mechanics.find((m) => m.id === active.id);
          if (candidate) setLocalValue([candidate, ...value]);
          setPopoverOpen(false);
        } else {
          // Assign as helper via API
          if (!workOrderId || isMutatingMechanicId) return;
          setIsMutatingMechanicId(String(active.id));
          try {
            const res = await fetch(
              `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mechanic_id: active.id }),
              },
            );
            const json = await res.json();
            if (!res.ok || json.error) {
              toast.error(json.error?.message ?? t("failedToAddHelper"));
            } else {
              toast.dismiss();
              toast.success(t("helperAdded"));
              const mechanic = mechanics.find((m) => m.id === active.id);
              if (mechanic) setLocalValue([...value, mechanic]);
              onHelpersChange();
            }
          } catch {
            toast.error(t("failedToAddHelper"));
          } finally {
            setIsMutatingMechanicId(null);
          }
        }
      } else if (!wasUnassigned && isNowAssigned) {
        // Reorder within assigned section
        const reordered = arrayMove(allItems, oldIndex, newIndex);
        const newOrderedIds = reordered
          .slice(0, assignedCount)
          .map((m) => m.id);
        if (newOrderedIds[0] !== leadMechanicId) {
          onLeadChange(newOrderedIds[0]);
        }
        setLocalValue(
          newOrderedIds
            .map((id) => mechanics.find((m) => m.id === id))
            .filter((m): m is MechanicOption => !!m),
        );
      } else if (!wasUnassigned && !isNowAssigned) {
        // Dragged from assigned to unassigned → remove
        const wasLead = oldIndex === 0;
        if (wasLead) {
          // Removing the lead — promote next helper to lead
          const remaining = value.filter((m) => m.id !== active.id);
          if (remaining.length > 0) {
            onLeadChange(remaining[0].id);
          }
          setLocalValue(remaining);
        } else {
          // Removing a helper via API
          if (!workOrderId || isMutatingMechanicId) return;
          setIsMutatingMechanicId(String(active.id));
          try {
            const res = await fetch(
              `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers?mechanicId=${active.id}`,
              { method: "DELETE" },
            );
            const json = await res.json();
            if (!res.ok || json.error) {
              toast.error(json.error?.message ?? t("failedToRemoveHelper"));
            } else {
              toast.dismiss();
              toast.success(t("helperRemoved"));
              setLocalValue(value.filter((m) => m.id !== active.id));
              onHelpersChange();
            }
          } catch {
            toast.error(t("failedToRemoveHelper"));
          } finally {
            setIsMutatingMechanicId(null);
          }
        }
        setPopoverOpen(false);
      }
    },
    [
      allItems,
      value,
      mechanics,
      workOrderId,
      orgId,
      leadMechanicId,
      onLeadChange,
      onHelpersChange,
      t,
      isMutatingMechanicId,
    ],
  );

  const CHIP_LIMIT = 3;

  return (
    <div className="relative">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setActiveDragId(String(active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <div className="flex min-h-9 min-w-[150px] max-w-[220px] items-center gap-1.5 rounded-xl border border-border/70 bg-background/90 px-2 py-1 shadow-sm backdrop-blur-sm">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <MechanicAvatarGroup
                mechanics={value}
                leadId={leadMechanicId}
                limit={CHIP_LIMIT}
                size="sm"
                emptyPlaceholder={t("selectMechanic")}
              />
            </div>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  disabled={saving || isMutatingMechanicId !== null}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50 hover:bg-muted hover:text-foreground transition-colors",
                    saving || isMutatingMechanicId !== null
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer",
                  )}
                  aria-label={t("addPlaceholder")}
                >
                  {isMutatingMechanicId ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Plus className="size-3" />
                  )}
                </button>
              }
            />
          </div>

          <PopoverContent
            className="w-72 p-0"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
                <span className="text-xs font-semibold">
                  {t("selectMechanic")}
                </span>
                <button
                  type="button"
                  onClick={() => setPopoverOpen(false)}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>

              <div className="border-b border-border/50 px-3 py-2">
                <div className="relative">
                  <Input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("selectMechanic")}
                    className="h-7 pl-2 pr-2 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearch("");
                        setPopoverOpen(false);
                      }
                    }}
                  />
                </div>
              </div>

              <SortableListBody
                items={mechanics}
                assignedItems={value}
                search={search}
                searchPredicate={(m, q) =>
                  m.full_name.toLowerCase().includes(q)
                }
                emptyText={
                  t("allMechanicsAssigned") ?? "All mechanics assigned"
                }
                noResultsText={t("noMechanics") ?? "No mechanics found"}
                renderItem={(m, { isAssigned, isLead }) => (
                  <SortableMechanicRow
                    mechanic={m as MechanicOption}
                    isAssigned={isAssigned}
                    isLead={isLead}
                    onToggle={(mechanicId) => {
                      if (isAssigned) {
                        // Unassign — if lead, promote next helper; if helper, remove
                        if (isLead) {
                          const remaining = value.filter(
                            (v) => v.id !== mechanicId,
                          );
                          if (remaining.length > 0) {
                            onLeadChange(remaining[0].id);
                          }
                          setLocalValue(remaining);
                        } else {
                          setPopoverOpen(false);
                          fetch(
                            `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers?mechanicId=${mechanicId}`,
                            { method: "DELETE" },
                          )
                            .then((res) => res.json())
                            .then((json) => {
                              if (!json.error) {
                                setLocalValue(
                                  value.filter((v) => v.id !== mechanicId),
                                );
                                onHelpersChange();
                              }
                            })
                            .catch(() => {});
                        }
                      } else {
                        // Assign — lead if first, helper otherwise
                        if (value.length === 0) {
                          onLeadChange(mechanicId);
                          const candidate = mechanics.find(
                            (m) => m.id === mechanicId,
                          );
                          if (candidate) setLocalValue([candidate]);
                        } else {
                          setPopoverOpen(false);
                          fetch(
                            `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                mechanic_id: mechanicId,
                              }),
                            },
                          )
                            .then((res) => res.json())
                            .then((json) => {
                              if (!json.error) {
                                const candidate = mechanics.find(
                                  (m) => m.id === mechanicId,
                                );
                                if (candidate)
                                  setLocalValue([...value, candidate]);
                                onHelpersChange();
                              }
                            })
                            .catch(() => {});
                        }
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
                  <span className="text-xs font-medium">
                    {dragged.full_name}
                  </span>
                </div>
              );
            })()}
          </DragOverlay>
        </DndContext>
      </Popover>
    </div>
  );
}
