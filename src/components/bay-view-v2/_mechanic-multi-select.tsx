"use client";

import { Crown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { getMechanicColor, getMechanicInitials } from "@/lib/mechanic-colors";
import { cn } from "@/lib/utils";

interface MechanicOption {
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
  const prevIdsRef = useRef<string[]>([]);
  const fetchCountRef = useRef(0);
  const lastRequestedRef = useRef<string | null>(null);

  // Optimistic: immediately reflect selection before server round-trip.
  const [optimistic, setOptimistic] = useState<MechanicOption[] | null>(null);

  const serverValue = buildSelectedValue(leadMechanicId, helpers, mechanics);

  // Reconcile: when server state matches the last requested state, drop optimistic.
  // Use stable JSON keys to avoid effect loops (serverValue is a new array every render).
  const serverKey = serverValue
    .map((m) => m.id)
    .sort()
    .join(",");
  const lastKey = lastRequestedRef.current;

  useEffect(() => {
    // Only reconcile if we have an optimistic value and there are no in-flight fetches
    if (!optimistic || !lastKey || fetchCountRef.current > 0) return;
    if (serverKey === lastKey) {
      // Server caught up — use canonical objects (may have richer data)
      setOptimistic(null);
      lastRequestedRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optimistic is a useState value, not a dep; serverKey+lastKey are the stable triggers
  }, [serverKey, lastKey]);

  const value = optimistic ?? serverValue;

  // Keep ref in sync with latest value for diffing in handleChange
  prevIdsRef.current = value.map((m) => m.id);

  const handleChange = useCallback(
    async (newValue: MechanicOption[]) => {
      if (!workOrderId) return;

      // 1. Optimistic: immediately show the new selection
      setOptimistic(newValue);

      const newIds = newValue.map((m) => m.id);
      const oldIds = prevIdsRef.current;

      // Record the last requested state so reconciliation knows when to stop
      lastRequestedRef.current = [...newIds].sort().join(",");

      const oldSet = new Set(oldIds);
      const newSet = new Set(newIds);

      const added = newValue.filter((m) => !oldSet.has(m.id));
      const removedIds = oldIds.filter((id) => !newSet.has(id));

      // Overwrite ref AFTER diff (snapshot old → compute diff → overwrite)
      prevIdsRef.current = newIds;

      // ── Additions ──
      for (const item of added) {
        const isOnlyItem = newValue.length === 1 && newValue[0]?.id === item.id;
        const becameLead =
          newValue[0]?.id === item.id && removedIds.length === 0;

        if (isOnlyItem || becameLead) {
          onLeadChange(item.id);
        } else {
          // Helper
          fetchCountRef.current++;
          try {
            const res = await fetch(
              `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mechanic_id: item.id }),
              },
            );
            const json = await res.json();
            if (json.error) {
              toast.error(json.error.message ?? "Failed to add helper");
              setOptimistic(null); // rollback to server state
            } else {
              toast.dismiss();
              toast.success("Helper added");
              onHelpersChange();
            }
          } catch {
            toast.error("Failed to add helper");
            setOptimistic(null); // rollback to server state
          } finally {
            fetchCountRef.current--;
          }
        }
      }

      // ── Removals ──
      for (const removedId of removedIds) {
        const wasLead = oldIds[0] === removedId;

        if (wasLead) {
          // Promote next mechanic to lead
          const newLead = newValue[0];
          if (newLead) {
            onLeadChange(newLead.id);
          }
        } else {
          fetchCountRef.current++;
          try {
            const res = await fetch(
              `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers?mechanicId=${removedId}`,
              { method: "DELETE" },
            );
            const json = await res.json();
            if (json.error) {
              toast.error(json.error.message ?? "Failed to remove helper");
              setOptimistic(null); // rollback to server state
            } else {
              toast.dismiss();
              toast.success("Helper removed");
              onHelpersChange();
            }
          } catch {
            toast.error("Failed to remove helper");
            setOptimistic(null); // rollback to server state
          } finally {
            fetchCountRef.current--;
          }
        }
      }
    },
    [workOrderId, orgId, onLeadChange, onHelpersChange],
  );

  const CHIP_LIMIT = 3;
  const visible = value.slice(0, CHIP_LIMIT);
  const hiddenCount = value.length - visible.length;

  return (
    <Combobox
      multiple
      items={mechanics}
      value={value}
      onValueChange={handleChange}
      isItemEqualToValue={(a, b) => a.id === b.id}
      itemToStringLabel={(m) => m?.full_name ?? ""}
      disabled={saving}
    >
      <ComboboxChips className="min-h-7 gap-1 rounded-full border-border/60 px-1.5 py-0.5">
        {visible.map((m, i) => {
          const color = getMechanicColor(m.id);
          const initials = getMechanicInitials(m.full_name);
          return (
            <ComboboxChip
              key={m.id}
              className="h-6 gap-1 rounded-full px-1.5 text-xs"
            >
              {i === 0 && <Crown className="size-3 shrink-0 text-amber-500" />}
              <Avatar className="size-4 shrink-0 after:hidden">
                <AvatarFallback
                  className={cn("text-[8px] font-medium", color.bg, color.text)}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[80px] truncate">{m.full_name}</span>
            </ComboboxChip>
          );
        })}
        {hiddenCount > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground">
            +{hiddenCount}
          </span>
        )}
        <ComboboxChipsInput
          placeholder="Add..."
          className="h-6 min-w-12 text-xs"
        />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxList>
          {(mechanic: MechanicOption) => {
            const color = getMechanicColor(mechanic.id);
            const initials = getMechanicInitials(mechanic.full_name);
            return (
              <ComboboxItem key={mechanic.id} value={mechanic}>
                <Avatar className="size-5 shrink-0 after:hidden">
                  <AvatarFallback
                    className={cn(
                      "text-[9px] font-medium",
                      color.bg,
                      color.text,
                    )}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-xs">
                  {mechanic.full_name}
                </span>
                {mechanic.current_jobs !== undefined &&
                  mechanic.current_jobs > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {mechanic.current_jobs}j
                    </span>
                  )}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
        <ComboboxEmpty>No mechanics</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}
