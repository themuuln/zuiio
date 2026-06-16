"use client";

import { Crown, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { MechanicAvatarGroup } from "@/components/mechanic-avatar-chip";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const MechanicRow = memo(function MechanicRow({
  mechanic,
  isAssigned,
  isLead,
  onToggle,
  onSetLead,
}: {
  mechanic: MechanicOption;
  isAssigned: boolean;
  isLead: boolean;
  onToggle?: (mechanicId: string) => void;
  onSetLead?: (mechanicId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle?.(mechanic.id)}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 hover:bg-accent/50 transition-colors text-left"
    >
      <Checkbox
        checked={isAssigned}
        onCheckedChange={() => onToggle?.(mechanic.id)}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="size-4 shrink-0 pointer-events-none"
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
      <div className="flex items-center gap-1 shrink-0">
        {isAssigned && !isLead && onSetLead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetLead(mechanic.id);
            }}
            className="flex size-5 items-center justify-center rounded text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
            title="Set as lead mechanic"
            aria-label={`Set ${mechanic.full_name} as lead`}
          >
            <Crown className="size-3.5" />
          </button>
        )}
        {isLead && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/12 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <Crown className="size-3" />
            Lead
          </span>
        )}
      </div>
    </button>
  );
});

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

  const serverValue = useMemo(
    () => buildSelectedValue(leadMechanicId, helpers, mechanics),
    [leadMechanicId, helpers, mechanics],
  );

  // Optimistic local state: set BEFORE API call, cleared when server catches up
  const [localValue, setLocalValue] = useState<MechanicOption[] | null>(null);
  const value = localValue ?? serverValue;

  // Track pending API operations to avoid clearing localValue prematurely
  const pendingOps = useRef(0);

  // Sync: when server catches up, drop local
  useEffect(() => {
    if (!localValue || pendingOps.current > 0) return;
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

  const assignedIds = new Set(value.map((m) => m.id));

  // Filter and order: assigned first, then unassigned
  const q = search.toLowerCase();
  const filtered = !q
    ? mechanics
    : mechanics.filter((m) => m.full_name.toLowerCase().includes(q));

  const unassigned = filtered.filter((m) => !assignedIds.has(m.id));
  const ordered = [...value, ...unassigned];

  const CHIP_LIMIT = 3;

  const handleToggle = useCallback(
    (mechanicId: string) => {
      const candidate = mechanics.find((m) => m.id === mechanicId);
      if (!candidate) return;

      const isAssigned = assignedIds.has(mechanicId);
      let nextValue: MechanicOption[];

      if (isAssigned) {
        // Unassign
        nextValue = value.filter((v) => v.id !== mechanicId);

        // Update UI immediately
        setLocalValue(nextValue);
        pendingOps.current++;

        if (mechanicId === leadMechanicId) {
          // Removing lead — promote next helper if any
          if (nextValue.length > 0) {
            onLeadChange(nextValue[0].id);
          }
          pendingOps.current--;
        } else {
          // Removing helper
          fetch(
            `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers?mechanicId=${mechanicId}`,
            { method: "DELETE" },
          )
            .then((res) => res.json())
            .then((json) => {
              if (json.error) {
                toast.error(t("failedToRemoveHelper"));
                // Revert on error
                setLocalValue(value);
              } else {
                onHelpersChange();
              }
            })
            .catch(() => {
              toast.error(t("failedToRemoveHelper"));
              setLocalValue(value);
            })
            .finally(() => pendingOps.current--);
        }
      } else {
        // Assign
        if (value.length === 0) {
          // First mechanic = lead
          nextValue = [candidate];
          setLocalValue(nextValue);
          onLeadChange(mechanicId);
        } else {
          // Helper
          nextValue = [...value, candidate];
          setLocalValue(nextValue);
          pendingOps.current++;

          fetch(
            `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mechanic_id: mechanicId }),
            },
          )
            .then((res) => res.json())
            .then((json) => {
              if (json.error) {
                toast.error(t("failedToAddHelper"));
                // Revert on error
                setLocalValue(value);
              } else {
                onHelpersChange();
              }
            })
            .catch(() => {
              toast.error(t("failedToAddHelper"));
              setLocalValue(value);
            })
            .finally(() => pendingOps.current--);
        }
      }
    },
    [
      assignedIds,
      value,
      leadMechanicId,
      mechanics,
      orgId,
      workOrderId,
      onLeadChange,
      onHelpersChange,
      t,
    ],
  );

  const handleSetLead = useCallback(
    (mechanicId: string) => {
      const candidate = mechanics.find((m) => m.id === mechanicId);
      if (!candidate) return;

      // Optimistic: rebuild with new lead first
      const updated = value.filter((v) => v.id !== mechanicId);
      setLocalValue([candidate, ...updated]);

      onLeadChange(mechanicId);
    },
    [mechanics, value, onLeadChange],
  );

  return (
    <div className="relative">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
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
                disabled={saving}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50 hover:bg-muted hover:text-foreground transition-colors",
                  saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                )}
                aria-label={t("addPlaceholder")}
              >
                <Plus className="size-3" />
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

            <div className="flex flex-col max-h-80 overflow-y-auto px-1 py-1">
              {ordered.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <span className="text-xs text-muted-foreground">
                    {search
                      ? (t("noMechanics") ?? "No mechanics found")
                      : (t("allMechanicsAssigned") ?? "All mechanics assigned")}
                  </span>
                </div>
              ) : (
                ordered.map((m) => (
                  <MechanicRow
                    key={m.id}
                    mechanic={m}
                    isAssigned={assignedIds.has(m.id)}
                    isLead={m.id === leadMechanicId}
                    onToggle={handleToggle}
                    onSetLead={handleSetLead}
                  />
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
