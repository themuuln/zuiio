"use client";

import { Car, ListOrdered, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { formatPlateNumber } from "@/lib/utils";

interface EmptyBayActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bayNumber: number;
  queue: (WorkOrder & { vehicle: Vehicle | null })[];
  onSelectRegister: () => void;
  onSelectQueueItem: (workOrderId: string) => void;
}

export function EmptyBayActionDialog({
  open,
  onOpenChange,
  bayNumber,
  queue,
  onSelectRegister,
  onSelectQueueItem,
}: EmptyBayActionDialogProps) {
  const [selectedQueueItem, setSelectedQueueItem] = useState<string | null>(
    null,
  );

  const handleRegister = () => {
    onOpenChange(false);
    onSelectRegister();
  };

  const handleQueueSelect = (woId: string) => {
    setSelectedQueueItem(woId);
    onOpenChange(false);
    onSelectQueueItem(woId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Add Vehicle to Bay #{bayNumber}
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to fill this bay.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* ── Primary: Register New Vehicle ─────────────── */}
          <button
            type="button"
            onClick={handleRegister}
            className="group flex items-center gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-left transition-all duration-200 hover:border-primary/60 hover:bg-primary/10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Car className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">
                Register New Vehicle
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Look up by plate or register a new vehicle and add to queue
              </div>
            </div>
            <div className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Select
            </div>
          </button>

          {/* ── Secondary: Assign from Queue ──────────────── */}
          {queue.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const firstItem = queue[0];
                if (firstItem) {
                  handleQueueSelect(firstItem.id);
                }
              }}
              className="group flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 text-left transition-all duration-200 hover:border-border hover:bg-muted/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shadow-sm transition-transform duration-200 group-hover:scale-105">
                <ListOrdered className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  Assign from Queue
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Pick a vehicle from the waiting queue ({queue.length} waiting)
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                Select
              </div>
            </button>
          )}

          {/* ── Queue preview list ────────────────────────── */}
          {queue.length > 0 && (
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto rounded-lg border border-border/40 bg-muted/10 p-2">
              {queue.slice(0, 10).map((wo) => (
                <Button
                  key={wo.id}
                  variant="ghost"
                  size="sm"
                  disabled={selectedQueueItem === wo.id}
                  onClick={() => handleQueueSelect(wo.id)}
                  className="w-full justify-start gap-2 h-auto py-2"
                >
                  {selectedQueueItem === wo.id ? (
                    <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                  ) : (
                    <Car className="size-4 text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <Typography.Text className="text-xs font-medium">
                      {formatPlateNumber(wo.vehicle?.plate_number ?? "")}
                    </Typography.Text>
                    <Typography.Muted className="text-[10px] text-muted-foreground block truncate">
                      {wo.vehicle?.make} {wo.vehicle?.model}
                    </Typography.Muted>
                  </div>
                </Button>
              ))}
              {queue.length > 10 && (
                <div className="text-center text-[10px] text-muted-foreground py-1">
                  +{queue.length - 10} more in queue
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
