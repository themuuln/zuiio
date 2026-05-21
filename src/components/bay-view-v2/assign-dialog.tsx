"use client";

import { useState, useEffect } from "react";
import { Car, CornerDownRight, Loader2, User } from "lucide-react";
import type { Vehicle, WorkOrder } from "@/lib/database.types";
import { formatPlateNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

  const filtered = search.trim()
    ? queue.filter((wo) => {
        const q = search.toLowerCase();
        const v = wo.vehicle;
        return (
          v?.plate_number?.toLowerCase().includes(q) ||
          v?.make?.toLowerCase().includes(q) ||
          v?.model?.toLowerCase().includes(q)
        );
      })
    : queue;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedWoId(null);
      setSelectedMechId(null);
      setSearch("");
      setSaving(false);
    }
  }, [open]);

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
  }, [open, selectedWoId, saving]);

  async function handleConfirm() {
    if (!selectedWoId) return;
    setSaving(true);
    try {
      await onAssign(selectedWoId, selectedMechId ?? undefined);
      onOpenChange(false);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Assign to Bay #{bayNumber}
          </DialogTitle>
          <DialogDescription>
            Pick a vehicle from the queue and optionally assign a mechanic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Vehicle</p>
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground/60 rounded-lg border border-dashed">
                <Car className="size-5 mb-1" />
                <p className="text-xs">No vehicles in queue</p>
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search queue..."
                    className="h-7 text-xs pl-2"
                  />
                </div>
                <ScrollArea className="max-h-[180px]">
                  <div className="space-y-1 pr-3">
                    {filtered.map((wo) => {
                      const v = wo.vehicle;
                      const isSelected = selectedWoId === wo.id;
                      return (
                        <button
                          key={wo.id}
                          type="button"
                          onClick={() => setSelectedWoId(isSelected ? null : wo.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30 hover:bg-muted/30",
                          )}
                        >
                          <div className={cn(
                            "flex size-7 items-center justify-center rounded-md shrink-0",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}>
                            <Car className="size-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {v ? formatPlateNumber(v.plate_number) : "No vehicle"}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {v ? `${v.make} ${v.model}` : wo.complaint || wo.id.slice(0, 8)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    {filtered.length === 0 && (
                      <p className="text-xs text-muted-foreground/60 text-center py-4">No match</p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Mechanic <span className="font-normal text-muted-foreground/50">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mechanics.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-2">No mechanics available</p>
              ) : (
                mechanics.map((m) => {
                  const isSelected = selectedMechId === m.id;
                  const initials = m.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) ?? "?";
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMechId(isSelected ? null : m.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30 hover:bg-muted/30 text-muted-foreground",
                      )}
                    >
                      <Avatar className="size-4">
                        <AvatarFallback className="text-[6px] bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {m.full_name ?? "Unknown"}
                    </button>
                  );
                })
              )}
              <button
                type="button"
                onClick={() => setSelectedMechId(null)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  !selectedMechId
                    ? "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30 text-muted-foreground/60",
                )}
              >
                <User className="size-3" />
                Skip
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <p className="text-[10px] text-muted-foreground/50">
            Bay #{bayNumber}{selectedMechId ? " + mechanic" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
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
