"use client";

import { Crown, Search, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Mechanic {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface MechanicQuickAssignProps {
  currentMechanic?: Mechanic | null;
  hasLeadMechanic?: boolean;
  helperMechanics?: Mechanic[];
  mechanics: Mechanic[];
  onAssignLead: (mechanicId: string) => Promise<void>;
  onAssignHelper: (mechanicId: string) => Promise<void>;
  onUnassign?: (mechanicId: string) => Promise<void>;
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
  disabled = false,
}: MechanicQuickAssignProps) {
  const t = useTranslations("bayView");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [localAssignedIds, setLocalAssignedIds] = useState<Set<string> | null>(
    null,
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalAssignedIds(null);
      setSearch("");
    }
    setOpen(newOpen);
  };

  const serverAssignedIds = new Set([
    ...(currentMechanic ? [currentMechanic.id] : []),
    ...helperMechanics.map((m) => m.id),
  ]);

  const assignedIds = localAssignedIds ?? serverAssignedIds;

  // Filter and order: assigned first, then unassigned
  const q = search.toLowerCase();
  const filtered = !q
    ? mechanics
    : mechanics.filter((m) => m.full_name.toLowerCase().includes(q));

  const unselected = filtered.filter((m) => !assignedIds.has(m.id));
  const selected = filtered.filter((m) => assignedIds.has(m.id));
  const ordered = [...selected, ...unselected];

  const handleToggle = (mechanicId: string) => {
    const wasAssigned = assignedIds.has(mechanicId);
    const newIds = new Set(assignedIds);

    if (wasAssigned) {
      newIds.delete(mechanicId);
      onUnassign?.(mechanicId).catch(() => {});
    } else {
      newIds.add(mechanicId);
      if (!hasLeadMechanic && !currentMechanic) {
        onAssignLead(mechanicId).catch(() => {});
      } else {
        onAssignHelper(mechanicId).catch(() => {});
      }
    }

    setLocalAssignedIds(newIds);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
        align="end"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
            <span className="text-xs font-semibold">
              {hasLeadMechanic
                ? (t("addHelper") ?? "Add Helper")
                : currentMechanic
                  ? (t("changeMechanic") ?? "Change Mechanic")
                  : (t("assignMechanic") ?? "Assign Mechanic")}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
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

          {/* Mechanic list */}
          <div className="flex flex-col max-h-80 overflow-y-auto px-1 py-1">
            {ordered.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <span className="text-xs text-muted-foreground">
                  {search
                    ? (t("noMechanicsFound") ?? "No mechanics found")
                    : (t("allMechanicsAssigned") ?? "All mechanics assigned")}
                </span>
              </div>
            ) : (
              ordered.map((m) => {
                const isAssigned = assignedIds.has(m.id);
                const isLead = m.id === currentMechanic?.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(m.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={isAssigned}
                      className="size-4 shrink-0 pointer-events-none"
                      aria-label={`Toggle ${m.full_name}`}
                    />
                    <MechanicAvatar mechanic={m} className="size-7 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">
                        {m.full_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isAssigned && !isLead && hasLeadMechanic && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssignLead(m.id).catch(() => {});
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
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
