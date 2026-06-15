"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type MechanicItem,
  MechanicPickerDrawer,
} from "@/components/mechanic-picker-drawer";
import { cn } from "@/lib/utils";

interface Mechanic extends MechanicItem {
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
  const [localAssignedIds, setLocalAssignedIds] = useState<Set<string> | null>(
    null,
  );

  // Reset local state when drawer opens so we start from server state
  useEffect(() => {
    if (open) setLocalAssignedIds(null);
  }, [open]);

  const serverAssignedIds = useMemo(
    () =>
      new Set([
        ...(currentMechanic ? [currentMechanic.id] : []),
        ...helperMechanics.map((m) => m.id),
      ]),
    [currentMechanic, helperMechanics],
  );

  const effectiveAssignedIds = localAssignedIds ?? serverAssignedIds;

  // Build ordered selected IDs: lead first, then helpers
  const selectedIds = useMemo(() => {
    const ids: string[] = [];
    if (currentMechanic && effectiveAssignedIds.has(currentMechanic.id)) {
      ids.push(currentMechanic.id);
    }
    for (const h of helperMechanics) {
      if (effectiveAssignedIds.has(h.id)) {
        ids.push(h.id);
      }
    }
    return ids;
  }, [currentMechanic, helperMechanics, effectiveAssignedIds]);

  const handleSelectionChange = useCallback(
    (newIds: string[]) => {
      // Diff to figure out what was toggled
      const removed = selectedIds.filter((id) => !newIds.includes(id));
      const added = newIds.filter((id) => !selectedIds.includes(id));

      if (removed.length === 1) {
        onUnassign?.(removed[0]).catch(() => {});
      } else if (added.length === 1) {
        if (!hasLeadMechanic) {
          onAssignLead(added[0]).catch(() => {});
        } else {
          onAssignHelper(added[0]).catch(() => {});
        }
      }

      // Keep local state in sync so checkbox reflects optimistically
      setLocalAssignedIds(new Set(newIds));
      setOpen(false);
    },
    [selectedIds, hasLeadMechanic, onAssignLead, onAssignHelper, onUnassign],
  );

  const handleReorder = useCallback(
    (orderedIds: string[]) => {
      onReorder?.(orderedIds).catch(() => {});
      setOpen(false);
    },
    [onReorder],
  );

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "flex size-6 items-center justify-center rounded-full border border-dashed transition-all duration-200",
          "text-muted-foreground/40 hover:text-primary hover:border-primary/50 hover:bg-primary/10",
          "active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
        )}
      >
        <UserPlus className="size-3" />
      </button>
      <MechanicPickerDrawer
        open={open}
        onOpenChange={setOpen}
        mechanics={mechanics}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onReorder={onReorder ? handleReorder : undefined}
        leadId={currentMechanic?.id ?? null}
        labels={{
          title: hasLeadMechanic
            ? "Add Helper"
            : currentMechanic
              ? "Change Mechanic"
              : "Assign Mechanic",
          searchPlaceholder: t("searchMechanics"),
          empty: t("allMechanicsAssigned") ?? "All mechanics assigned",
          noResults: t("noMechanicsFound") ?? "No mechanics found",
        }}
      />
    </>
  );
}
