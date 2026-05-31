"use client";

import { CheckCircle2, History } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import type { WorkOrderStatusHistory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusTimelineProps {
  statusHistory: WorkOrderStatusHistory[];
  t: (key: string) => string;
}

const STATUS_COLORS: Record<string, { dot: string; text: string }> = {
  New: {
    dot: "bg-yellow-500 ring-yellow-500/20",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  Diagnosing: {
    dot: "bg-blue-500 ring-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  "In Progress": {
    dot: "bg-amber-500 ring-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  "Ready for Pickup": {
    dot: "bg-green-500 ring-green-500/20",
    text: "text-green-600 dark:text-green-400",
  },
  Completed: {
    dot: "bg-emerald-500 ring-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  Cancelled: {
    dot: "bg-rose-500 ring-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
  },
};

const STATUS_NAMES: Record<string, string> = {
  New: "statusNew",
  Diagnosing: "statusDiagnosing",
  "In Progress": "statusInProgress",
  "Ready for Pickup": "statusReadyForPickup",
  Completed: "statusCompleted",
  Cancelled: "statusCancelled",
};

export function StatusTimeline({ statusHistory, t }: StatusTimelineProps) {
  return (
    <section
      aria-labelledby="status-timeline-title"
      className="rounded-lg border border-border/60 bg-card/40 p-3"
    >
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center size-5 rounded-md bg-purple-500/10">
            <History className="size-3 text-purple-500" />
          </div>
          <h3
            id="status-timeline-title"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {t("statusTimeline")}
          </h3>
        </div>
        <p className="text-[10px] text-muted-foreground/60 leading-normal pl-0.5">
          {t("statusTimelineDescription")}
        </p>
      </div>

      {(statusHistory ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 text-muted-foreground/50">
          <div className="flex items-center justify-center size-8 rounded-full bg-muted/40 mb-2">
            <History className="size-4 opacity-60" />
          </div>
          <Typography.Text className="text-xs font-medium">
            {t("noHistoryYet")}
          </Typography.Text>
        </div>
      ) : (
        <div className="flex flex-col gap-0 pl-1 mt-2">
          {statusHistory?.map((h, idx) => {
            const isLast = idx === (statusHistory?.length ?? 0) - 1;
            const colors = STATUS_COLORS[h.status] ?? {
              dot: "bg-slate-500 ring-slate-500/20",
              text: "text-slate-600 dark:text-slate-400",
            };
            const statusLabel = STATUS_NAMES[h.status]
              ? t(STATUS_NAMES[h.status])
              : h.status;

            return (
              <div key={h.id} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast && (
                  <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-border/60" />
                )}
                <div className="relative z-10 mt-1 shrink-0">
                  <div
                    className={cn(
                      "size-5 rounded-full ring-4 flex items-center justify-center transition-all duration-300",
                      colors.dot,
                    )}
                  >
                    {h.status === "Completed" ||
                    h.status === "Ready for Pickup" ? (
                      <CheckCircle2 className="size-3 text-white" />
                    ) : (
                      <div className="size-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold tracking-tight",
                        colors.text,
                      )}
                    >
                      {statusLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0 font-mono">
                      {new Date(h.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(h.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {h.notes && (
                    <Typography.Muted className="text-xs text-muted-foreground mt-0.5 bg-muted/40 rounded-lg px-2.5 py-1.5 border border-border/40 leading-relaxed break-words">
                      {h.notes}
                    </Typography.Muted>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
