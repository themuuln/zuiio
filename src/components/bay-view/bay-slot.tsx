"use client";

import { useDroppable } from "@dnd-kit/core";
import { Clock, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";
import { MechanicBadge } from "./mechanic-badge";
import { StatusPill } from "./status-pill";
import { VehicleCard } from "./vehicle-card";

// ── Duration thresholds (minutes) ──────────────────────────────
const WARN_THRESHOLD = 90; // amber at 90 min
const OVERDUE_THRESHOLD = 180; // red at 180 min

// ── Helpers ───────────────────────────────────────────

function getDurationTint(minutes: number): string {
  if (minutes > OVERDUE_THRESHOLD) return "text-red-400";
  if (minutes > WARN_THRESHOLD) return "text-amber-400";
  return "text-muted-foreground";
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Elapsed Timer (stable — ref-based to avoid Date.now drift) ─

function ElapsedTimer({ startedAt }: { startedAt: string | null | undefined }) {
  const [display, setDisplay] = useState("");
  const startedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startedAt) {
      setDisplay("");
      startedRef.current = null;
      return;
    }

    const startedMs = new Date(startedAt).getTime();
    startedRef.current = startedMs;

    const tick = () => {
      if (startedRef.current === null) return;
      const elapsed = Date.now() - startedRef.current;
      if (elapsed <= 0) {
        setDisplay("");
        return;
      }
      setDisplay(formatDuration(elapsed));
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [startedAt]);

  if (!startedAt || !display) return null;

  const minutes = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs tabular-nums",
        getDurationTint(minutes),
      )}
    >
      <Clock className="size-3" />
      {display}
    </div>
  );
}

// ── Bay Slot ───────────────────────────────────────────

interface BaySlotProps {
  bay: BaySlotData;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay: (woId: string) => void;
  onAssignMechanic: (woId: string, mechanicId: string) => void;
}

export function BaySlot({
  bay,
  onStatusChange,
  onRemoveFromBay,
}: BaySlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `bay-${bay.bayNumber}` });
  const wo = bay.workOrder;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex flex-col rounded-xl border-2 p-3 transition-all duration-200 min-h-[180px]",
        isOver &&
          "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20 scale-[1.02]",
        !wo &&
          "border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/50",
        wo &&
          wo.status === "New" &&
          "border-yellow-400/50 bg-yellow-50/20 dark:bg-yellow-950/10 shadow-sm",
        wo &&
          wo.status === "Diagnosing" &&
          "border-blue-400/50 bg-blue-50/20 dark:bg-blue-950/10 shadow-sm",
        wo &&
          wo.status === "In Progress" &&
          "border-amber-400/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-md",
        wo &&
          wo.status === "Ready for Pickup" &&
          "border-green-400/60 bg-green-50/20 dark:bg-green-950/10 shadow-md",
        wo &&
          wo.status === "Completed" &&
          "border-green-500/30 bg-green-50/10 dark:bg-green-950/5 opacity-75",
        wo &&
          wo.status === "Cancelled" &&
          "border-red-400/30 bg-red-50/10 dark:bg-red-950/5 opacity-75",
      )}
      style={
        wo?.status === "In Progress"
          ? { animation: "wave 3s ease-in-out infinite" }
          : wo?.status === "Ready for Pickup"
            ? { animation: "glow 2s ease-in-out infinite" }
            : undefined
      }
    >
      {/* Bay number + Status */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide",
            wo
              ? "bg-foreground/10 text-foreground/80"
              : "bg-muted/50 text-muted-foreground/50",
          )}
        >
          BAY {bay.bayNumber}
        </span>
        {wo && <StatusPill status={wo.status} />}
      </div>

      {wo ? (
        <div className="flex flex-col gap-2.5 flex-1">
          {/* Vehicle info */}
          {wo.vehicle ? (
            <VehicleCard
              workOrderId={wo.id}
              vehicle={wo.vehicle}
              customerName={wo.customer_name}
              serviceDescription={wo.complaint ?? wo.description}
            />
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground text-xs">
              No vehicle assigned
            </div>
          )}

          {/* Bottom row: mechanic + timer */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
            <MechanicBadge workOrderId={wo.id} mechanic={wo.mechanic} />
            <ElapsedTimer startedAt={wo.started_at ?? wo.created_at} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5 mt-1" role="group" aria-label="Work order actions">
            {wo.status !== "Ready for Pickup" && wo.status !== "Completed" && wo.status !== "Cancelled" && (
              <button
                type="button"
                onClick={() => onStatusChange(wo.id, "Ready for Pickup")}
                className="flex-1 rounded-md bg-green-500/10 px-2 py-1.5 text-xs font-medium text-green-600 hover:bg-green-500/20 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label="Mark work order ready for pickup"
              >
                Mark Ready
              </button>
            )}
            {wo.status === "Ready for Pickup" && (
              <button
                type="button"
                onClick={() => onStatusChange(wo.id, "Completed")}
                className="flex-1 rounded-md bg-green-500/10 px-2 py-1.5 text-xs font-medium text-green-600 hover:bg-green-500/20 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label="Mark work order as completed"
              >
                Complete
              </button>
            )}
            {wo.status !== "Cancelled" && (
              <button
                type="button"
                onClick={() => onStatusChange(wo.id, "Cancelled")}
                className="flex-1 rounded-md bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Cancel work order"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemoveFromBay(wo.id)}
              className="flex-1 rounded-md bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Remove vehicle from bay"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-2.5 text-muted-foreground/30">
          <div className="relative">
            <MapPin className="size-10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-3 rounded-full bg-primary/40 animate-ping" />
            </div>
          </div>
          <span className="text-xs font-medium">Drop vehicle here</span>
        </div>
      )}
    </div>
  );
}
