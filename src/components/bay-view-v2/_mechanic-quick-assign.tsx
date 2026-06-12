"use client";

import { Loader2, Search, UserPlus, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Typography } from "@/components/ui/typography";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Mechanic {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  current_jobs?: number;
}

interface MechanicQuickAssignProps {
  /** Current work order ID to assign mechanic to */
  _workOrderId?: string;
  /** Current mechanic (if any) — shown as selected */
  currentMechanic?: Mechanic | null;
  /** All available mechanics */
  mechanics: Mechanic[];
  /** Called when a mechanic is selected */
  onAssign: (mechanicId: string) => Promise<void>;
  /** Called to remove the current mechanic */
  onRemove?: () => Promise<void>;
  /** Disable interactions */
  disabled?: boolean;
}

export function MechanicQuickAssign({
  currentMechanic,
  mechanics,
  onAssign,
  onRemove,
  disabled = false,
}: MechanicQuickAssignProps) {
  const t = useTranslations("bayView");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return mechanics;
    const q = search.toLowerCase();
    return mechanics.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
    );
  }, [mechanics, search]);

  const handleSelect = useCallback(
    async (mechanicId: string) => {
      if (mechanicId === currentMechanic?.id) return;
      setSaving(mechanicId);
      try {
        await onAssign(mechanicId);
        setOpen(false);
        setSearch("");
      } finally {
        setSaving(null);
      }
    },
    [currentMechanic?.id, onAssign],
  );

  const handleRemove = useCallback(async () => {
    if (!onRemove) return;
    setSaving("remove");
    try {
      await onRemove();
      setOpen(false);
    } finally {
      setSaving(null);
    }
  }, [onRemove]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        className="w-64 p-0"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
            <Typography.Text className="text-xs font-semibold">
              {currentMechanic ? "Change Mechanic" : "Assign Mechanic"}
            </Typography.Text>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
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

          {/* Current mechanic */}
          {currentMechanic && (
            <div className="border-b border-border/50 px-3 py-2">
              <Typography.Muted className="text-[10px] font-medium uppercase tracking-wider mb-1.5">
                Current
              </Typography.Muted>
              <div className="flex items-center gap-2">
                <MechanicAvatar mechanic={currentMechanic} className="size-6" />
                <span className="text-xs font-medium flex-1 truncate">
                  {currentMechanic.full_name ?? "Unknown"}
                </span>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    disabled={saving !== null}
                    className="text-muted-foreground/40 hover:text-red-500"
                  >
                    {saving === "remove" ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <X className="size-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Mechanic list */}
          <ScrollArea className="max-h-[200px]">
            <div className="p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <Typography.Muted className="text-xs">
                    {search ? "No mechanics found" : "No mechanics available"}
                  </Typography.Muted>
                </div>
              ) : (
                filtered.map((m) => {
                  const isSelected = m.id === currentMechanic?.id;
                  const isSaving = saving === m.id;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isSelected || saving !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(m.id);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                        "hover:bg-accent/50 disabled:opacity-50",
                        isSelected && "bg-accent/30",
                      )}
                    >
                      <MechanicAvatar mechanic={m} className="size-6" />
                      <span className="text-xs font-medium flex-1 truncate">
                        {m.full_name ?? "Unknown"}
                      </span>
                      {m.current_jobs !== undefined && (
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {m.current_jobs}
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] text-primary font-medium">
                          Current
                        </span>
                      )}
                      {isSaving && (
                        <Loader2 className="size-3 animate-spin text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
