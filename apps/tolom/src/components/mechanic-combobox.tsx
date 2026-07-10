"use client";

import { Crown, Plus, Search, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { NewMechanicSheet } from "@/components/new-mechanic-drawer";
import { Input } from "@/components/ui/input";
import type { MechanicPickerOption } from "@/lib/types/mechanic";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

export interface MechanicComboboxProps {
  /** All available mechanics to pick from */
  mechanics: MechanicPickerOption[];
  /** Single-select mode: currently selected mechanic ID */
  selectedId?: string | null;
  /** Multi-select mode: currently selected mechanic IDs in order */
  selectedIds?: string[];
  /** Multi-select mode: ID of the lead mechanic (shows "Lead" badge) */
  leadId?: string | null;
  /** Called when a mechanic is selected in single mode */
  onSelect?: (mechanicId: string) => void;
  /** Called when a mechanic is toggled in multi mode */
  onToggle?: (mechanicId: string) => void;
  /** Called when a mechanic should become the lead (multi mode) */
  onSetLead?: (mechanicId: string) => void;
  /** Whether to show the "Add Mechanic" button */
  showAddButton?: boolean;
  /** Called after a new mechanic is added */
  onMechanicAdded?: () => void;
  /** Custom labels */
  labels?: {
    searchPlaceholder?: string;
    empty?: string;
    noResults?: string;
    addMechanic?: string;
  };
  /** Allow clearing the selection (show unchecked for selected) */
  allowDeselect?: boolean;
  /** Optional class name for the container */
  className?: string;
}

// ─── Row ───────────────────────────────────────────────────────

function MechanicPickerRow({
  mechanic,
  isSelected,
  isLead,
  isMultiSelect,
  showCrownAction,
  onToggle,
  onSetLead,
}: {
  mechanic: MechanicPickerOption;
  isSelected: boolean;
  isLead: boolean;
  isMultiSelect: boolean;
  showCrownAction: boolean;
  onToggle?: (id: string) => void;
  onSetLead?: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.(mechanic.id);
      }}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-accent/50 cursor-pointer"
    >
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
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation container */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {showCrownAction && isSelected && !isLead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetLead?.(mechanic.id);
            }}
            className="flex size-6 items-center justify-center rounded text-muted-foreground/30 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
            title="Set as lead mechanic"
          >
            <Crown className="size-3.5" />
          </button>
        )}
        {isLead && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/12 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <Crown className="size-3" />
            Lead
          </span>
        )}
        {isMultiSelect ? (
          <span
            className={cn(
              "inline-flex size-5 items-center justify-center rounded border text-[10px] font-medium transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "border-muted-foreground/20 text-muted-foreground/40",
            )}
          >
            {isSelected ? "✓" : ""}
          </span>
        ) : isSelected ? (
          <span className="inline-flex size-5 items-center justify-center rounded bg-primary text-primary-foreground text-[10px] font-medium">
            ✓
          </span>
        ) : null}
      </div>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────

export function MechanicCombobox({
  mechanics,
  selectedId,
  selectedIds,
  leadId,
  onSelect,
  onToggle,
  onSetLead,
  showAddButton = true,
  onMechanicAdded,
  labels,
  allowDeselect = false,
  className,
}: MechanicComboboxProps) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const isMultiSelect = selectedIds !== undefined;

  // Derive selected set
  const selectedSet = useMemo(() => {
    if (isMultiSelect) return new Set(selectedIds ?? []);
    return new Set(selectedId ? [selectedId] : []);
  }, [isMultiSelect, selectedIds, selectedId]);

  // Filter and order: selected first, then unassigned
  const q = search.toLowerCase().trim();
  const filtered = useMemo(() => {
    if (!q) return mechanics;
    return mechanics.filter(
      (m) => m.full_name?.toLowerCase().includes(q) ?? false,
    );
  }, [mechanics, q]);

  const ordered = useMemo(() => {
    const selected = filtered.filter((m) => selectedSet.has(m.id));
    const unselected = filtered.filter((m) => !selectedSet.has(m.id));
    return [...selected, ...unselected];
  }, [filtered, selectedSet]);

  const handleToggle = useCallback(
    (mechanicId: string) => {
      if (isMultiSelect) {
        onToggle?.(mechanicId);
      } else {
        const isSelected = selectedSet.has(mechanicId);
        if (isSelected && allowDeselect) {
          onSelect?.("");
        } else if (!isSelected) {
          onSelect?.(mechanicId);
        }
      }
    },
    [isMultiSelect, onSelect, onToggle, selectedSet, allowDeselect],
  );

  const searchPlaceholder = labels?.searchPlaceholder ?? "Search mechanics...";
  const emptyText = labels?.empty ?? "All mechanics assigned";
  const noResultsText = labels?.noResults ?? "No mechanics found";
  const addMechanicLabel = labels?.addMechanic ?? "Add mechanic";

  const showEmpty = ordered.length === 0 && !q;
  const showNoResults = ordered.length === 0 && q.length > 0;

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {/* Search */}
        <div className="shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-8 pr-3 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearch("");
                }
              }}
            />
          </div>
        </div>

        {/* Mechanic list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 max-h-[60vh]">
          {mechanics.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <Users className="size-5 animate-pulse text-muted-foreground/30" />
            </div>
          )}
          {mechanics.length > 0 && (showEmpty || showNoResults) && (
            <div className="px-3 py-8 text-center">
              <span className="text-xs text-muted-foreground">
                {showNoResults ? noResultsText : emptyText}
              </span>
            </div>
          )}
          {mechanics.length > 0 && !showEmpty && !showNoResults && (
            <div className="flex flex-col">
              {ordered.map((m) => (
                <MechanicPickerRow
                  key={m.id}
                  mechanic={m}
                  isSelected={selectedSet.has(m.id)}
                  isLead={m.id === leadId}
                  isMultiSelect={isMultiSelect}
                  showCrownAction={isMultiSelect && !!onSetLead}
                  onToggle={handleToggle}
                  onSetLead={onSetLead}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add mechanic footer */}
        {showAddButton && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAddOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-accent/50 cursor-pointer"
            >
              <span className="flex size-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/30">
                <Plus className="size-3.5 text-muted-foreground/40" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {addMechanicLabel}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Add mechanic sheet */}
      <NewMechanicSheet
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open && onMechanicAdded) {
            onMechanicAdded();
          }
        }}
      />
    </>
  );
}
