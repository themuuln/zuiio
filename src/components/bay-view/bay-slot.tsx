"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  Car,
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const WARN_THRESHOLD = 90;
const OVERDUE_THRESHOLD = 180;

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

const STATUS_BAR: Record<string, string> = {
  New: "bg-yellow-400",
  Diagnosing: "bg-blue-400",
  "In Progress": "bg-amber-400",
  "Ready for Pickup": "bg-green-400",
  Completed: "bg-green-500/50",
  Cancelled: "bg-red-400/50",
};

const STATUS_BORDER: Record<string, string> = {
  New: "border-yellow-400/50 bg-yellow-50/10 shadow-yellow-500/5 dark:bg-yellow-950/8",
  Diagnosing:
    "border-blue-400/50 bg-blue-50/10 shadow-blue-500/5 dark:bg-blue-950/8",
  "In Progress":
    "border-amber-400/50 bg-amber-50/10 shadow-amber-500/10 dark:bg-amber-950/8 animate-[pulse-ring_2s_ease-in-out_infinite]",
  "Ready for Pickup":
    "border-green-400/50 bg-green-50/10 shadow-green-500/10 dark:bg-green-950/8 animate-[glow_2s_ease-in-out_infinite]",
  Completed:
    "border-green-500/30 bg-green-50/5 opacity-75 dark:bg-green-950/5",
  Cancelled: "border-red-400/30 bg-red-50/5 opacity-75 dark:bg-red-950/5",
};

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ElapsedTimer({
  startedAt,
}: {
  startedAt: string | null | undefined;
}) {
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
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt || !display) return null;

  const minutes = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 60000,
  );

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs tabular-nums",
        getDurationTint(minutes),
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shadow-[0_0_8px]",
          getDurationDotTint(minutes),
        )}
      />
      <Clock className="size-3" />
      {display}
    </div>
  );
}

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
  const v = wo?.vehicle;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 animate-[scale-in_0.3s_ease-out]",
        "cursor-default",
        isOver && "border-primary/60 bg-primary/5 shadow-lg ring-2 ring-primary/20 scale-[1.02]",
        wo
          ? `bg-card p-3 shadow-sm ${STATUS_BORDER[wo.status] ?? "border-border"}`
          : "min-h-[120px] border-dashed border-muted-foreground/25 bg-muted/10 p-3 hover:border-primary/40 hover:bg-primary/[0.03]",
      )}
    >
      {wo && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
            STATUS_BAR[wo.status] ?? "bg-primary",
          )}
        />
      )}

      {!wo && (
        <div className="pointer-events-none absolute inset-2 rounded-xl bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.12)_1px,transparent_0)] bg-[length:14px_14px]" />
      )}

      {wo ? (
        <div className="relative z-10 flex flex-1 flex-col gap-2.5 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-tight text-muted-foreground/60">
              #{bay.bayNumber}
            </span>
          </div>

          {v ? (
            <div className="flex items-start gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground/60 ring-1 ring-border/40">
                <Car className="size-4" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground/90">
                    {v.plate_number}
                  </span>
                  <span className="shrink-0 rounded bg-muted/60 px-1 py-0.5 text-[9px] font-semibold text-muted-foreground">
                    {v.make}
                  </span>
                </div>
                {v.model && (
                  <div className="text-[11px] text-muted-foreground/70 truncate">
                    {v.model}
                    {v.year ? ` · ${v.year}` : ""}
                  </div>
                )}
                {(wo.complaint ?? wo.description) && (
                  <div className="text-[10px] text-muted-foreground/50 truncate leading-relaxed">
                    {wo.complaint ?? wo.description}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2 text-xs text-muted-foreground/60 italic">
              {t("noVehicleAssigned")}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-border/30 pt-2">
            <div className="flex items-center gap-1.5">
              <MechanicBadge workOrderId={wo.id} mechanic={wo.mechanic} />
              {isPending && (
                <Loader2 className="size-3 animate-spin text-muted-foreground/50" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <ElapsedTimer startedAt={wo.started_at ?? wo.created_at} />
              <div className="flex items-center gap-0.5 ml-1.5">
                {wo.status !== "Ready for Pickup" &&
                  wo.status !== "Completed" &&
                  wo.status !== "Cancelled" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onStatusChange(wo.id, "Ready for Pickup")}
                          className="flex items-center justify-center rounded-md size-7 text-green-600 bg-green-500/10 ring-1 ring-green-500/15 transition-all hover:bg-green-500/20 active:scale-90"
                          aria-label={t("markReady")}
                        >
                          <CheckCircle2 className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{t("markReady")}</TooltipContent>
                    </Tooltip>
                  )}
                {wo.status === "Ready for Pickup" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onStatusChange(wo.id, "Completed")}
                        className="flex items-center justify-center rounded-md size-7 text-green-600 bg-green-500/10 ring-1 ring-green-500/15 transition-all hover:bg-green-500/20 active:scale-90"
                        aria-label={t("complete")}
                      >
                        <CheckCircle2 className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t("complete")}</TooltipContent>
                  </Tooltip>
                )}
                {wo.status !== "Completed" && wo.status !== "Cancelled" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onRemoveFromBay(wo.id)}
                        className="flex items-center justify-center rounded-md size-7 text-destructive bg-destructive/10 ring-1 ring-destructive/15 transition-all hover:bg-destructive/20 active:scale-90"
                        aria-label={t("removeFromBay")}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t("removeFromBay")}</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onOpenDetail(wo.id)}
                      className="flex items-center justify-center rounded-md size-7 text-muted-foreground bg-muted/50 ring-1 ring-border/40 transition-all hover:bg-muted/80 hover:text-foreground active:scale-90"
                      aria-label={t("manage")}
                    >
                      <Maximize2 className="size-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{t("manage")}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-semibold tracking-tight text-muted-foreground/40">
            #{bay.bayNumber}
          </span>
          <div className="rounded-full bg-background/60 p-2.5 ring-1 ring-border/30 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md group-hover:ring-primary/30">
            <MapPin className="size-8 text-muted-foreground/40 transition-all duration-200 group-hover:text-primary/60" />
          </div>
          <span className="text-xs font-medium text-muted-foreground/50 transition-all duration-200 group-hover:text-primary/70">
            {t("dropVehicleHere")}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
    </div>
  );
}
