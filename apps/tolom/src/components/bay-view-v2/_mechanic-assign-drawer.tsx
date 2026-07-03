"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MechanicPickerDrawer } from "@/components/mechanic-picker-drawer";
import type { HelperRef, MechanicPickerOption } from "@/lib/types/mechanic";
import { cn } from "@/lib/utils";
import { buildSelectedMechanics } from "./_mechanic-helpers";

interface MechanicAssignSheetProps {
  trigger: React.ReactNode;
  mechanics: MechanicPickerOption[];
  leadMechanicId: string | null;
  helpers: HelperRef[];
  onAssignLead?: (mechanicId: string) => Promise<void>;
  onAssignHelper?: (mechanicId: string) => Promise<void>;
  onUnassign?: (mechanicId: string) => Promise<void>;
  disabled?: boolean;
}

// ── Main Component ──────────────────────────────────────────

export function MechanicAssignSheet({
  trigger,
  mechanics,
  leadMechanicId,
  helpers,
  onAssignLead,
  onAssignHelper,
  onUnassign,
  disabled = false,
}: MechanicAssignSheetProps) {
  const t = useTranslations("bayView");
  const [open, setOpen] = useState(false);

  // Server-derived value: computed from props after server confirms the change.
  const serverValue = useMemo(
    () => buildSelectedMechanics(leadMechanicId, helpers, mechanics),
    [leadMechanicId, helpers, mechanics],
  );

  // Local optimistic state: applied immediately on toggle, cleared once
  // the server value catches up.
  const [localValue, setLocalValue] = useState<MechanicPickerOption[] | null>(
    null,
  );
  const value = localValue ?? serverValue;

  // Sync: when server catches up to local state, drop the optimistic override.
  const serverIdsRef = useRef<string>("");
  useEffect(() => {
    if (!localValue) return;
    const s = serverValue
      .map((m) => m.id)
      .sort()
      .join(",");
    if (serverIdsRef.current === "") {
      serverIdsRef.current = s;
      return;
    }
    const l = localValue
      .map((m) => m.id)
      .sort()
      .join(",");
    if (l === s) {
      setLocalValue(null);
      serverIdsRef.current = "";
    }
  }, [localValue, serverValue]);

  // Reset local state when the sheet closes.
  useEffect(() => {
    if (!open) {
      setLocalValue(null);
      serverIdsRef.current = "";
    }
  }, [open]);

  const selectedIds = useMemo(() => value.map((m) => m.id), [value]);

  // ── Mutation logic (with optimistic guard) ───────────────

  const mutatingRef = useRef(false);

  const handleToggle = useCallback(
    (mechanicId: string) => {
      if (mutatingRef.current) return;
      mutatingRef.current = true;

      const candidate = mechanics.find((m) => m.id === mechanicId);
      if (!candidate) {
        mutatingRef.current = false;
        return;
      }

      const isAssigned = selectedIds.includes(mechanicId);

      // Apply optimistic local state
      if (isAssigned) {
        setLocalValue(value.filter((m) => m.id !== mechanicId));
      } else {
        setLocalValue([...value, candidate]);
      }

      // Build and run the mutation promise chain
      const run = () => {
        if (isAssigned) {
          if (mechanicId === leadMechanicId) {
            const nextLead = value.find((v) => v.id !== mechanicId);
            return nextLead
              ? Promise.resolve(onAssignLead?.(nextLead.id)).then(() =>
                  onUnassign?.(mechanicId),
                )
              : (onUnassign?.(mechanicId) ?? Promise.resolve());
          }
          return onUnassign?.(mechanicId) ?? Promise.resolve();
        }
        if (selectedIds.length === 0) {
          return onAssignLead?.(mechanicId) ?? Promise.resolve();
        }
        return onAssignHelper?.(mechanicId) ?? Promise.resolve();
      };

      run().then(
        () => {
          mutatingRef.current = false;
        },
        () => {
          mutatingRef.current = false;
        },
      );
    },
    [
      selectedIds,
      value,
      leadMechanicId,
      mechanics,
      onAssignLead,
      onAssignHelper,
      onUnassign,
    ],
  );

  const handleSetLead = useCallback(
    (mechanicId: string) => {
      onAssignLead?.(mechanicId);
    },
    [onAssignLead],
  );

  const headerText = leadMechanicId ? t("changeMechanic") : t("assignMechanic");

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        disabled={disabled}
        className={cn("inline-flex", disabled && "opacity-50")}
      >
        {trigger}
      </button>
      <MechanicPickerDrawer
        open={open}
        onOpenChange={setOpen}
        mechanics={mechanics}
        selectedIds={selectedIds}
        leadId={leadMechanicId}
        onToggle={handleToggle}
        onSetLead={handleSetLead}
        showAddButton={false}
        title={headerText}
        labels={{
          searchPlaceholder: t("searchMechanics"),
          empty: t("allMechanicsAssigned"),
          noResults: t("noMechanicsFound"),
        }}
      />
    </>
  );
}
