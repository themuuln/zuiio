"use client";

import { Crown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const t = useTranslations("bayView");
  const inFlightRef = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const serverValue = useMemo(
    () => buildSelectedValue(leadMechanicId, helpers, mechanics),
    [leadMechanicId, helpers, mechanics],
  );

  // Single source of truth: null means use server value
  const [localValue, setLocalValue] = useState<MechanicOption[] | null>(null);

  // Ref to always have latest value in callbacks without stale closures
  const valueRef = useRef(serverValue);
  const value = localValue ?? serverValue;
  valueRef.current = value;

  // Sync: when server matches local, drop local
  useEffect(() => {
    if (!localValue) return;
    if (inFlightRef.current > 0) return; // still waiting for API
    const localIds = localValue
      .map((m) => m.id)
      .sort()
      .join(",");
    const serverIds = serverValue
      .map((m) => m.id)
      .sort()
      .join(",");
    if (localIds === serverIds) {
      setLocalValue(null);
    }
  }, [localValue, serverValue]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      setSearch("");
    }
  }, [dropdownOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, [dropdownOpen]);

  const toggleMechanic = useCallback(
    async (mechanic: MechanicOption) => {
      if (!workOrderId) return;

      const currentValue = valueRef.current;
      const isSelected = currentValue.some((m) => m.id === mechanic.id);

      // Optimistic: compute new value immediately
      const newValue = isSelected
        ? currentValue.filter((m) => m.id !== mechanic.id)
        : [...currentValue, mechanic];
      setLocalValue(newValue);

      if (isSelected) {
        // Removing
        const wasLead = currentValue[0]?.id === mechanic.id;
        if (wasLead) {
          const newLead = newValue[0];
          if (newLead) onLeadChange(newLead.id);
        } else {
          inFlightRef.current++;
          try {
            const res = await fetch(
              `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers?mechanicId=${mechanic.id}`,
              { method: "DELETE" },
            );
            const json = await res.json();
            if (!res.ok || json.error) {
              toast.error(json.error?.message ?? t("failedToRemoveHelper"));
              setLocalValue(null); // rollback
            } else {
              toast.dismiss();
              toast.success(t("helperRemoved"));
              onHelpersChange();
            }
          } catch {
            toast.error(t("failedToRemoveHelper"));
            setLocalValue(null); // rollback
          } finally {
            inFlightRef.current--;
          }
        }
      } else {
        // Adding
        const isFirst = currentValue.length === 0;
        if (isFirst) {
          onLeadChange(mechanic.id);
        } else {
          inFlightRef.current++;
          try {
            const res = await fetch(
              `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mechanic_id: mechanic.id }),
              },
            );
            const json = await res.json();
            if (!res.ok || json.error) {
              toast.error(json.error?.message ?? t("failedToAddHelper"));
              setLocalValue(null); // rollback
            } else {
              toast.dismiss();
              toast.success(t("helperAdded"));
              onHelpersChange();
            }
          } catch {
            toast.error(t("failedToAddHelper"));
            setLocalValue(null); // rollback
          } finally {
            inFlightRef.current--;
          }
        }
      }
    },
    [workOrderId, orgId, onLeadChange, onHelpersChange, t],
  );

  const CHIP_LIMIT = 3;
  const visible = value.slice(0, CHIP_LIMIT);
  const hiddenCount = value.length - visible.length;
  const selectedIds = useMemo(() => new Set(value.map((m) => m.id)), [value]);

  const filteredMechanics = useMemo(() => {
    if (!search.trim()) return mechanics;
    const q = search.toLowerCase();
    return mechanics.filter((m) => m.full_name.toLowerCase().includes(q));
  }, [mechanics, search]);

  return (
    <div className="relative">
      {/* Chips — min-h prevents collapse when empty, flex-wrap handles overflow */}
      <div className="flex min-h-7 flex-wrap items-center gap-1 rounded-full border-border/60 px-1.5 py-0.5">
        {visible.map((m, i) => {
          return (
            <div
              key={m.id}
              className="flex h-6 items-center gap-1 rounded-full bg-muted px-1.5 text-xs font-medium"
            >
              {i === 0 && <Crown className="size-3 shrink-0 text-amber-500" />}
              <MechanicAvatar mechanic={m} className="size-4 shrink-0" />
              <span className="max-w-[60px] truncate">{m.full_name}</span>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground">
            +{hiddenCount}
          </span>
        )}
        <Button
          ref={triggerRef}
          variant="outline"
          size="icon-xs"
          className="h-6 w-6 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen((o) => !o);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={saving}
          aria-label={t("addPlaceholder")}
          aria-expanded={dropdownOpen}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      {/* Inline dropdown */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border bg-popover p-1 shadow-md ring-1 ring-foreground/10"
        >
          <Input
            ref={searchInputRef}
            placeholder={t("addPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="no-scrollbar mt-1 max-h-60 overflow-y-auto">
            {filteredMechanics.length === 0 ? (
              <div className="py-2 text-center text-xs text-muted-foreground">
                {t("noMechanics")}
              </div>
            ) : (
              filteredMechanics.map((mechanic) => {
                const isSelected = selectedIds.has(mechanic.id);
                const isLead = value[0]?.id === mechanic.id;
                return (
                  <button
                    key={mechanic.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs outline-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMechanic(mechanic);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MechanicAvatar
                      mechanic={mechanic}
                      className="size-5 shrink-0"
                    />
                    <span className="flex-1 truncate">
                      {mechanic.full_name}
                    </span>
                    {mechanic.current_jobs !== undefined &&
                      mechanic.current_jobs > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {mechanic.current_jobs}j
                        </span>
                      )}
                    {isLead && (
                      <Crown className="size-3 shrink-0 text-amber-500" />
                    )}
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="size-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
