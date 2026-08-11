import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Car, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { prefetchDrawerData } from "@/lib/queries/use-drawer-queries";
import type { BayViewWorkOrder } from "@/lib/services/bay-view-service";
import type { Vehicle } from "@/lib/types";
import { cn, formatPlateNumber } from "@/lib/utils";
import { ElapsedText } from "./_elapsed-display";

type QueueItem = BayViewWorkOrder & { vehicle: Vehicle | null };

interface QueueRailProps {
  items: QueueItem[];
  open: boolean;
  onToggle: () => void;
  onItemClick: (wo: QueueItem) => void;
  onAssignToBay: (woId: string) => void;
  /** orgId used to warm the drawer detail cache on hover/focus. */
  orgId?: string | null;
  t: (key: string) => string;
}

export function QueueRail({
  items,
  open,
  onToggle,
  onItemClick,
  onAssignToBay,
  orgId,
  t,
}: QueueRailProps) {
  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Warm the drawer detail cache on hover/focus — same 200ms debounce
  // pattern as the list view rows.
  const handleHover = useCallback(
    (woId: string) => {
      if (woId && orgId) {
        clearTimeout(prefetchTimerRef.current);
        prefetchTimerRef.current = setTimeout(() => {
          prefetchDrawerData(queryClient, orgId, woId);
        }, 200);
      }
    },
    [orgId, queryClient],
  );

  useEffect(() => {
    return () => clearTimeout(prefetchTimerRef.current);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex-shrink-0 border-l border-border/40 bg-card transition-[width] duration-200 ease-out overflow-hidden",
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
                onMouseEnter={() => handleHover(wo.id)}
                onFocus={() => handleHover(wo.id)}
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignToBay(wo.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onAssignToBay(wo.id);
                      }
                    }}
                    className="inline-flex items-center justify-center size-5 rounded text-muted-foreground/40 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title={t("assignToBay")}
                  >
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
