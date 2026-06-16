"use client";

import { Crown, Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MechanicOption {
  id: string;
  full_name: string | null;
  current_jobs?: number;
}

interface Helper {
  id: string;
  mechanic_id?: string;
  full_name?: string | null | undefined;
}

interface MechanicAssignSheetProps {
  trigger: React.ReactNode;
  mechanics: MechanicOption[];
  leadMechanicId: string | null;
  helpers: Helper[];
  onAssignLead?: (mechanicId: string) => Promise<void>;
  onAssignHelper?: (mechanicId: string) => Promise<void>;
  onUnassign?: (mechanicId: string) => Promise<void>;
  disabled?: boolean;
}

// ── Row ──────────────────────────────────────────────────────

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
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.(mechanic.id);
      }}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 hover:bg-accent/50 transition-colors text-left"
    >
      <Checkbox
        checked={isAssigned}
        className="size-4 shrink-0 pointer-events-none"
      />
      <MechanicAvatar mechanic={mechanic} className="size-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">
          {mechanic.full_name ?? "Unknown"}
        </div>
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
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onSetLead(mechanic.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onSetLead(mechanic.id);
              }
            }}
            className="flex size-5 items-center justify-center rounded text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
            title="Set as lead mechanic"
          >
            <Crown className="size-3.5" />
          </span>
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

// ── Helpers ──────────────────────────────────────────────────

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
  const [search, setSearch] = useState("");

  const serverValue = useMemo(
    () => buildSelectedValue(leadMechanicId, helpers, mechanics),
    [leadMechanicId, helpers, mechanics],
  );

  // Optimistic local state: set BEFORE callback, cleared when server catches up
  const [localValue, setLocalValue] = useState<MechanicOption[] | null>(null);
  const value = localValue ?? serverValue;

  // Reset search when opening
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const assignedIds = new Set(value.map((m) => m.id));

  const q = search.toLowerCase();
  const filtered = !q
    ? mechanics
    : mechanics.filter((m) => (m.full_name ?? "").toLowerCase().includes(q));

  const unassigned = filtered.filter((m) => !assignedIds.has(m.id));
  const ordered = [...value, ...unassigned];

  // ── Actions ──────────────────────────────────────────────

  const handleToggle = useCallback(
    (mechanicId: string) => {
      const candidate = mechanics.find((m) => m.id === mechanicId);
      if (!candidate) return;

      const isAssigned = assignedIds.has(mechanicId);

      if (isAssigned) {
        // ── Unassign ──
        const nextValue = value.filter((v) => v.id !== mechanicId);
        setLocalValue(nextValue);

        if (mechanicId === leadMechanicId) {
          // Removing lead — promote next helper
          if (nextValue.length > 0) {
            onAssignLead?.(nextValue[0].id);
          }
          onUnassign?.(mechanicId);
        } else {
          onUnassign?.(mechanicId);
        }
      } else {
        // ── Assign ──
        if (value.length === 0) {
          // First mechanic = lead
          setLocalValue([candidate]);
          onAssignLead?.(mechanicId);
        } else {
          // Helper
          setLocalValue([...value, candidate]);
          onAssignHelper?.(mechanicId);
        }
      }
    },
    [
      assignedIds,
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
      const candidate = mechanics.find((m) => m.id === mechanicId);
      if (!candidate) return;
      const updated = value.filter((v) => v.id !== mechanicId);
      setLocalValue([candidate, ...updated]);
      onAssignLead?.(mechanicId);
    },
    [mechanics, value, onAssignLead],
  );

  const headerText = leadMechanicId ? t("changeMechanic") : t("assignMechanic");

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger
        render={
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
            className={cn("inline-flex", disabled && "opacity-50")}
          >
            {trigger}
          </button>
        }
      />
      <DrawerContent
        className="sm:max-w-sm"
        contentClassName="flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <span className="text-sm font-semibold">{headerText}</span>
          <DrawerClose
            render={
              <button
                type="button"
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            }
          />
        </div>

        {/* Search */}
        <div className="border-b border-border/50 px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchMechanics")}
              className="h-9 pl-8 pr-3 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearch("");
                  setOpen(false);
                }
              }}
            />
          </div>
        </div>

        {/* Loading */}
        {mechanics.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
          </div>
        )}

        {/* Mechanic list */}
        {mechanics.length > 0 && (
          <div className="flex flex-col flex-1 overflow-y-auto px-2 py-2 max-h-[60vh]">
            {ordered.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <span className="text-sm text-muted-foreground">
                  {search
                    ? (t("noMechanicsFound") ?? "No mechanics found")
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
        )}
      </DrawerContent>
    </Drawer>
  );
}
