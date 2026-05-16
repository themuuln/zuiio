"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Maximize2,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
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

function getDurationDotTint(minutes: number): string {
  if (minutes > OVERDUE_THRESHOLD) return "bg-red-400 shadow-red-400/30";
  if (minutes > WARN_THRESHOLD) return "bg-amber-400 shadow-amber-400/30";
  return "bg-emerald-400 shadow-emerald-400/30";
}

function getDurationPercent(startedAt: string | null | undefined): number {
  if (!startedAt) return 0;
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000),
  );
  return Math.min(100, Math.round((minutes / OVERDUE_THRESHOLD) * 100));
}

function getStatusAccent(status: string): string {
  switch (status) {
    case "New":
      return "from-yellow-300/80 via-yellow-400/60 to-yellow-500/20";
    case "Diagnosing":
      return "from-blue-300/80 via-blue-400/60 to-blue-500/20";
    case "In Progress":
      return "from-amber-300/90 via-amber-400/70 to-orange-500/30";
    case "Ready for Pickup":
      return "from-emerald-300/90 via-green-400/70 to-green-500/30";
    case "Completed":
      return "from-green-300/50 via-green-400/35 to-green-500/10";
    case "Cancelled":
      return "from-red-300/50 via-red-400/35 to-red-500/10";
    default:
      return "from-primary/50 via-primary/30 to-transparent";
  }
}

function getStatusBar(status: string): string {
  switch (status) {
    case "New":
      return "bg-yellow-400";
    case "Diagnosing":
      return "bg-blue-400";
    case "In Progress":
      return "bg-amber-400";
    case "Ready for Pickup":
      return "bg-green-400";
    case "Completed":
      return "bg-green-500/50";
    case "Cancelled":
      return "bg-red-400/50";
    default:
      return "bg-primary";
  }
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

  const minutes = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 60000,
  );

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs tabular-nums transition-all duration-200",
        getDurationTint(minutes),
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shadow-[0_0_8px] transition-all duration-200",
          getDurationDotTint(minutes),
        )}
      />
      <Clock className="size-3" />
      {display}
    </div>
  );
}

// ── Bay Slot ───────────────────────────────────────────

interface BaySlotProps {
  bay: BaySlotData;
  isPending?: boolean;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay: (woId: string) => void;
  onAssignMechanic: (woId: string, mechanicId: string) => void;
  onOpenDetail: (woId: string) => void;
}

export function BaySlot({
  bay,
  isPending,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
}: BaySlotProps) {
  const t = useTranslations("bayView");
  const { setNodeRef, isOver } = useDroppable({ id: `bay-${bay.bayNumber}` });
  const wo = bay.workOrder;
  const durationPercent = getDurationPercent(wo?.started_at ?? wo?.created_at);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative flex min-h-[180px] flex-col overflow-hidden rounded-xl border p-3.5 transition-all duration-200",
        isOver &&
          "border-primary/60 bg-primary/5 shadow-lg ring-2 ring-primary/20",
        isOver && !wo && "scale-[1.04]",
        isOver && wo && "scale-[1.02]",
        !wo &&
          "border-dashed border-muted-foreground/25 bg-[linear-gradient(135deg,hsl(var(--muted)/0.18)_0%,hsl(var(--muted)/0.08)_45%,hsl(var(--background))_100%)] hover:border-primary/45 hover:bg-primary/5 hover:shadow-md",
        wo &&
          wo.status === "New" &&
          "border-yellow-400/30 bg-yellow-50/15 shadow-sm shadow-yellow-500/5 dark:bg-yellow-950/10",
        wo &&
          wo.status === "Diagnosing" &&
          "border-blue-400/30 bg-blue-50/15 shadow-sm shadow-blue-500/5 dark:bg-blue-950/10",
        wo &&
          wo.status === "In Progress" &&
          "border-amber-400/35 bg-amber-50/15 shadow-md shadow-amber-500/15 dark:bg-amber-950/10",
        wo &&
          wo.status === "Ready for Pickup" &&
          "border-green-400/35 bg-green-50/15 shadow-md shadow-green-500/15 dark:bg-green-950/10",
        wo &&
          wo.status === "Completed" &&
          "border-green-500/20 bg-green-50/10 opacity-75 shadow-sm shadow-green-500/5 dark:bg-green-950/5",
        wo &&
          wo.status === "Cancelled" &&
          "border-red-400/20 bg-red-50/10 opacity-75 shadow-sm shadow-red-500/5 dark:bg-red-950/5",
      )}
      style={
        wo?.status === "In Progress"
          ? { animation: "wave 3s ease-in-out infinite" }
          : wo?.status === "Ready for Pickup"
            ? { animation: "glow 2s ease-in-out infinite" }
            : undefined
      }
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-r opacity-30 transition-all duration-200",
          wo ? getStatusAccent(wo.status) : "from-primary/20 via-muted/25 to-transparent",
        )}
      />
      {wo ? (
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 transition-all duration-200",
            getStatusBar(wo.status),
          )}
        />
      ) : (
        <div className="pointer-events-none absolute inset-2 rounded-lg bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.16)_1px,transparent_0)] bg-[length:12px_12px] opacity-70 transition-all duration-200 group-hover:opacity-100" />
      )}

      {/* Bay number + Status */}
      <div className="relative z-10 mb-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-all duration-200",
            wo
              ? "bg-background/70 text-foreground/70 shadow-sm ring-1 ring-border/50 backdrop-blur"
              : "bg-background/60 text-muted-foreground/70 ring-1 ring-border/40 backdrop-blur",
          )}
        >
          {t("bayLabel", { number: bay.bayNumber })}
        </span>
        {wo && <StatusPill status={wo.status} />}
      </div>

      {wo ? (
        <div className="relative z-10 flex flex-1 flex-col gap-3">
          {/* Vehicle info */}
          {wo.vehicle ? (
            <VehicleCard
              workOrderId={wo.id}
              vehicle={wo.vehicle}
              customerName={wo.customer_name}
              serviceDescription={wo.complaint ?? wo.description}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground transition-all duration-200">
              {t("noVehicleAssigned")}
            </div>
          )}

          {/* Bottom row: mechanic + timer + pending indicator */}
          <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-2.5 transition-all duration-200">
            <div className="flex items-center gap-2">
              <MechanicBadge workOrderId={wo.id} mechanic={wo.mechanic} />
              {isPending && (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground/60 transition-all duration-200" />
              )}
            </div>
            <ElapsedTimer startedAt={wo.started_at ?? wo.created_at} />
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-muted/60 transition-all duration-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-200",
                durationPercent >= 100
                  ? "bg-red-400"
                  : durationPercent >= 50
                    ? "bg-amber-400"
                    : "bg-emerald-400",
              )}
              style={{ width: `${durationPercent}%` }}
            />
          </div>

          {/* Quick actions row */}
          <fieldset
            className="mt-1 flex gap-1.5 border-0 p-0"
            aria-label={t("manage")}
          >
            {/* Contextual status action */}
            {wo.status !== "Ready for Pickup" &&
              wo.status !== "Completed" &&
              wo.status !== "Cancelled" && (
                <button
                  type="button"
                  onClick={() => onStatusChange(wo.id, "Ready for Pickup")}
                  className="flex flex-1 items-center justify-center rounded-lg bg-green-500/10 px-2 py-1.5 text-green-600 shadow-sm ring-1 ring-green-500/15 transition-all duration-200 hover:bg-green-500/20 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  aria-label={t("markReady")}
                >
                  <CheckCircle2 className="size-4" />
                </button>
              )}
            {wo.status === "Ready for Pickup" && (
              <button
                type="button"
                onClick={() => onStatusChange(wo.id, "Completed")}
                className="flex flex-1 items-center justify-center rounded-lg bg-green-500/10 px-2 py-1.5 text-green-600 shadow-sm ring-1 ring-green-500/15 transition-all duration-200 hover:bg-green-500/20 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label={t("complete")}
              >
                <CheckCircle2 className="size-4" />
              </button>
            )}
            {/* Remove from bay */}
            {wo.status !== "Completed" && wo.status !== "Cancelled" && (
              <button
                type="button"
                onClick={() => onRemoveFromBay(wo.id)}
                className="flex items-center justify-center rounded-lg bg-destructive/10 px-2 py-1.5 text-destructive shadow-sm ring-1 ring-destructive/15 transition-all duration-200 hover:bg-destructive/20 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                aria-label={t("removeFromBay")}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
            {/* Open detail drawer */}
            <button
              type="button"
              onClick={() => onOpenDetail(wo.id)}
              className="flex items-center justify-center rounded-lg bg-primary/10 px-2.5 py-1.5 text-primary shadow-sm ring-1 ring-primary/15 transition-all duration-200 hover:bg-primary/20 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t("manage")}
            >
              <Maximize2 className="size-3.5" />
            </button>
          </fieldset>
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 rounded-lg bg-gradient-to-br from-background/70 via-muted/20 to-primary/5 text-muted-foreground transition-all duration-200 group-hover:from-primary/5 group-hover:to-primary/10">
          <div className="relative rounded-full bg-background/70 p-3 shadow-sm ring-1 ring-border/50 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md">
            <MapPin className="size-10 animate-bounce text-primary/55 transition-all duration-200 group-hover:text-primary/75" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-3 rounded-full bg-primary/40 animate-ping transition-all duration-200" />
            </div>
          </div>
          <span className="text-sm font-semibold text-foreground/70 transition-all duration-200 group-hover:text-primary">
            {t("dropVehicleHere")}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
    </div>
  );
}
