"use client";

import { Car, CornerDownRight, Loader2, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { cn, formatPlateNumber } from "@/lib/utils";

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bayNumber: number;
  queue: (WorkOrder & { vehicle: Vehicle | null })[];
  mechanics: { id: string; full_name: string | null }[];
  onAssign: (workOrderId: string, mechanicId?: string) => Promise<void>;
}

export function AssignDialog({
  open,
  onOpenChange,
  bayNumber,
  queue,
  mechanics,
  onAssign,
}: AssignDialogProps) {
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [selectedMechId, setSelectedMechId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Dropdown-style: list visible only when the search input is focused and non-empty
  const showQueue = searchFocused && search.trim().length > 0;

  const filtered = useFuzzySearch(queue, search, {
    keys: ["vehicle.plate_number", "vehicle.make", "vehicle.model"],
    threshold: 0.4,
    minQueryLength: 1,
  });

  // Cleanup blur timer on unmount
  useEffect(() => {
    return () => clearTimeout(blurTimerRef.current);
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedWoId(null);
      setSelectedMechId(null);
      setSearch("");
      setSaving(false);
    }
  }, [open]);

  const handleConfirm = useCallback(async () => {
    if (!selectedWoId) return;
    setSaving(true);
    try {
      await onAssign(selectedWoId, selectedMechId ?? undefined);
      onOpenChange(false);
    } catch (err) {
      console.error("Assign failed:", err);
    } finally {
      setSaving(false);
    }
  }, [selectedWoId, selectedMechId, onAssign, onOpenChange]);

  // Keyboard shortcuts: 1-9 to select bay, Enter to confirm, Escape is built-in
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && selectedWoId && !saving) {
        handleConfirm();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedWoId, saving, handleConfirm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" initialFocus={searchRef}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Assign to Bay #{bayNumber}
          </DialogTitle>
          <DialogDescription>
            Pick a vehicle from the queue and optionally assign a mechanic.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Vehicle
            </p>
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground/60  border border-dashed">
                <Car className="size-5 mb-1" />
                <p className="text-xs">No vehicles in queue</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => {
                      clearTimeout(blurTimerRef.current);
                      setSearchFocused(true);
                    }}
                    onBlur={() => {
                      blurTimerRef.current = setTimeout(() => {
                        setSearchFocused(false);
                      }, 150);
                    }}
                    placeholder="Search queue..."
                    className="h-7 text-xs pl-2"
                  />
                </div>

                {showQueue ? (
                  <ScrollArea className="max-h-[180px]">
                    <div className="flex flex-col gap-1 pr-3">
                      {filtered.map((wo) => {
                        const v = wo.vehicle;
                        const isSelected = selectedWoId === wo.id;
                        return (
                          <Button
                            variant="ghost"
                            key={wo.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedWoId(isSelected ? null : wo.id);
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              setSelectedWoId(isSelected ? null : wo.id);
                            }}
                            className={cn(
                              "w-full justify-start gap-2.5 px-2.5 py-2 h-auto text-left",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border",
                            )}
                          >
                            <div
                              className={cn(
                                "flex size-7 items-center justify-center  shrink-0",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Car className="size-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {v
                                  ? formatPlateNumber(v.plate_number)
                                  : "No vehicle"}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {v
                                  ? `${v.make} ${v.model}`
                                  : wo.complaint || wo.id.slice(0, 8)}
                              </p>
                            </div>
                          </Button>
                        );
                      })}
                      {filtered.length === 0 && (
                        <p className="text-xs text-muted-foreground/60 text-center py-4">
                          No match
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                ) : selectedWoId ? (
                  (() => {
                    const wo = queue.find((w) => w.id === selectedWoId);
                    const v = wo?.vehicle;
                    return (
                      <div className="flex items-center gap-2.5 border border-primary/30 bg-primary/5 px-2.5 py-2">
                        <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
                          <Car className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {v
                              ? formatPlateNumber(v.plate_number)
                              : "No vehicle"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {v ? `${v.make} ${v.model}` : (wo?.complaint ?? "")}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 text-center">
                    <Car className="size-5 text-muted-foreground/30 mb-1" />
                    <p className="text-xs text-muted-foreground/60">
                      {queue.length} vehicle{queue.length !== 1 ? "s" : ""}{" "}
                      waiting
                    </p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                      Type in the search above to browse the queue
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Mechanic{" "}
              <span className="font-normal text-muted-foreground/50">
                (optional)
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mechanics.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-2">
                  No mechanics available
                </p>
              ) : (
                mechanics.map((m) => {
                  const isSelected = selectedMechId === m.id;
                  const initials =
                    m.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ?? "?";
                  return (
                    <Button
                      key={m.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedMechId(isSelected ? null : m.id)
                      }
                      className="gap-1.5 px-2.5 py-1 text-xs"
                    >
                      <Avatar className="size-4">
                        <AvatarFallback className="text-[6px] bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {m.full_name ?? "Unknown"}
                    </Button>
                  );
                })
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMechId(null)}
                className={cn(
                  "gap-1.5 px-2.5 py-1 text-xs",
                  !selectedMechId
                    ? "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                    : "border-border text-muted-foreground/60",
                )}
              >
                <User className="size-3" />
                Skip
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <p className="text-[10px] text-muted-foreground/50">
            Bay #{bayNumber}
            {selectedMechId ? " + mechanic" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedWoId || saving}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CornerDownRight className="size-3.5" />
              )}
              {saving ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
