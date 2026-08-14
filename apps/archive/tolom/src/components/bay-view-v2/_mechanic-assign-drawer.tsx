"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MechanicPickerDrawer } from "@/components/mechanic-picker-drawer";
import type { HelperRef, MechanicPickerOption } from "@/lib/types/mechanic";
import { cn } from "@/lib/utils";
import { buildSelectedMechanics } from "./_mechanic-helpers";

/** Order-insensitive id signature of an ordered mechanic list. */
const idsOf = (list: MechanicPickerOption[]) =>
  list
    .map((m) => m.id)
    .sort()
    .join(",");

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

export function MechanicAssignDrawer({
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

  // Local optimistic state: applied immediately on every toggle, cleared once
  // the server value catches up.
  const [localValue, setLocalValue] = useState<MechanicPickerOption[] | null>(
    null,
  );
  const value = localValue ?? serverValue;

  // Latest-value refs so toggles and flushes compose without stale closures
  // (state closures go stale between renders).
  const valueRef = useRef(value);
  valueRef.current = value;
  const serverValueRef = useRef(serverValue);
  serverValueRef.current = serverValue;

  const flushInFlightRef = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Net-diff flush: transform the server value into the desired value with
  // the minimal mutation set. Redundant ops are no-ops server-side, so a
  // re-flush computed against a slightly stale server value is always safe.
  const runFlush = useCallback(async () => {
    if (flushInFlightRef.current) return;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const desired = valueRef.current;
    if (!desired) return;
    const server = serverValueRef.current;

    const serverIds = server.map((m) => m.id);
    const serverLeadId = serverIds[0] ?? null;
    const serverHelperIds = new Set(serverIds.slice(1));
    const desiredIds = new Set(desired.map((m) => m.id));
    const desiredLeadId = desired[0]?.id ?? null;

    // Helper removals: server helpers no longer wanted (the new lead is
    // cleared from helpers by assignLead itself, so skip it here).
    const removals: string[] = [];
    for (const id of serverHelperIds) {
      if (id !== desiredLeadId && !desiredIds.has(id)) removals.push(id);
    }
    // Helper adds: wanted helpers not currently on the server as helpers
    // (the old lead becomes a helper when a promotion happens).
    const adds: string[] = [];
    for (const m of desired.slice(1)) {
      if (!serverHelperIds.has(m.id)) adds.push(m.id);
    }
    const leadChanged = desiredLeadId !== serverLeadId;
    if (removals.length === 0 && adds.length === 0 && !leadChanged) return;

    flushInFlightRef.current = true;
    try {
      // Removals first (so clearing the lead never promotes a leftover
      // helper), then the lead change, then adds.
      for (const id of removals) {
        await onUnassign?.(id);
      }
      if (leadChanged) {
        if (desiredLeadId) {
          await onAssignLead?.(desiredLeadId);
        } else {
          await onUnassign?.(serverLeadId ?? "");
        }
      }
      for (const id of adds) {
        await onAssignHelper?.(id);
      }
    } catch {
      // Roll back to the server truth — the settle refetch restores it.
      setLocalValue(null);
      toast.error("Failed to update mechanics");
    } finally {
      flushInFlightRef.current = false;
      // If the user toggled during the flush, the reconcile effect below
      // schedules a re-flush once the server value catches up.
    }
  }, [onAssignLead, onAssignHelper, onUnassign]);

  // Debounced flush trigger: coalesces rapid toggles into one server sync.
  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void runFlush();
    }, 350);
  }, [runFlush]);

  // Reconcile: drop the optimistic overlay once the server catches up;
  // re-diff when the server value changes (the settle-triggered refetch)
  // while the desired state still differs.
  useEffect(() => {
    if (!localValue) return;
    if (idsOf(localValue) === idsOf(serverValue)) {
      setLocalValue(null);
      return;
    }
    if (flushInFlightRef.current || flushTimerRef.current) return;
    scheduleFlush();
  }, [serverValue, localValue, scheduleFlush]);

  // Flush pending changes when the sheet closes (the drawer may close before
  // the debounce fires). Keep the optimistic overlay until the server catches
  // up so the reconcile effect can re-flush a toggle made mid-flush.
  useEffect(() => {
    if (open) return;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (idsOf(valueRef.current) === idsOf(serverValueRef.current)) {
      setLocalValue(null);
      return;
    }
    void runFlush();
  }, [open, runFlush]);

  const selectedIds = useMemo(() => value.map((m) => m.id), [value]);

  // ── Mutation logic (fully optimistic, debounced server sync) ──

  const handleToggle = useCallback(
    (mechanicId: string) => {
      const candidate = mechanics.find((m) => m.id === mechanicId);
      if (!candidate) return;
      const current = valueRef.current;
      const isAssigned = current.some((m) => m.id === mechanicId);
      const next = isAssigned
        ? current.filter((m) => m.id !== mechanicId)
        : [...current, candidate];

      // Flip the picker instantly — no dropping, no waiting on the server.
      valueRef.current = next;
      setLocalValue(next);
      scheduleFlush();
    },
    [mechanics, scheduleFlush],
  );

  const handleSetLead = useCallback(
    (mechanicId: string) => {
      const current = valueRef.current;
      const candidate = current.find((m) => m.id === mechanicId);
      if (!candidate) return;
      const next = [candidate, ...current.filter((m) => m.id !== mechanicId)];
      valueRef.current = next;
      setLocalValue(next);
      scheduleFlush();
    },
    [scheduleFlush],
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
        aria-label={headerText}
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
