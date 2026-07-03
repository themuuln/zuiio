"use client";

import { ArrowRight, Car, X } from "lucide-react";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatPlateNumber } from "@/lib/utils";
import { ElapsedText } from "./_elapsed-text";

type QueueItem = WorkOrder & { vehicle: Vehicle | null };

interface QueueRailProps {
  items: QueueItem[];
  open: boolean;
  onToggle: () => void;
  onItemClick: (wo: QueueItem) => void;
  onAssignToBay: (woId: string) => void;
  t: (key: string) => string;
}

export function QueueRail({
  items,
  open,
  onToggle,
  onItemClick,
  onAssignToBay,
  t,
}: QueueRailProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex-shrink-0 border-l border-border/40 bg-card transition-all duration-200 ease-out overflow-hidden",
        open ? "w-[260px]" : "w-0",
      )}
    >
      <div className="flex flex-col h-full w-[260px]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Car className="size-3.5" />
            {t("waitingQueue")}
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[10px] font-mono"
            >
              {items.length}
            </Badge>
          </div>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={onToggle}
            className="size-5 rounded text-muted-foreground/50 hover:text-foreground cursor-pointer"
            aria-label={t("close")}
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Queue items */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-px p-2">
            {items.map((wo) => (
              <button
                key={wo.id}
                type="button"
                onClick={() => onItemClick(wo)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/60 cursor-pointer group w-full"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-xs font-semibold">
                    {wo.vehicle
                      ? formatPlateNumber(wo.vehicle.plate_number ?? "")
                      : "\u2014"}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {wo.vehicle
                      ? `${wo.vehicle.make ?? ""} ${wo.vehicle.model ?? ""}`
                      : t("unknownVehicle")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground/60">
                    <ElapsedText startedAt={wo.created_at} />
                  </span>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignToBay(wo.id);
                    }}
                    className="size-5 rounded text-muted-foreground/40 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title={t("assignToBay")}
                  >
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
