"use client";

import { CheckCircle2, History, User, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import type {
  WorkOrderServiceHistoryEntry,
  WorkOrderStatusHistory,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusTimelineProps {
  statusHistory: WorkOrderStatusHistory[];
  serviceHistory: WorkOrderServiceHistoryEntry[];
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

export function StatusTimeline({
  statusHistory,
  serviceHistory,
  t,
}: StatusTimelineProps) {
  const hasStatusHistory = (statusHistory ?? []).length > 0;
  const hasServiceHistory = (serviceHistory ?? []).length > 0;

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

      {!hasStatusHistory && !hasServiceHistory ? (
        <div className="flex flex-col items-center justify-center py-5 text-muted-foreground/50">
          <div className="flex items-center justify-center size-8 rounded-full bg-muted/40 mb-2">
            <History className="size-4 opacity-60" />
          </div>
          <Typography.Text className="text-xs font-medium">
            {t("noHistoryYet")}
          </Typography.Text>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-4">
          {hasStatusHistory ? (
            <div className="flex flex-col gap-0 pl-1">
              {statusHistory.map((h, idx) => {
                const isLast = idx === statusHistory.length - 1;
                const colors = STATUS_COLORS[h.status] ?? {
                  dot: "bg-slate-500 ring-slate-500/20",
                  text: "text-slate-600 dark:text-slate-400",
                };
                const statusLabel = STATUS_NAMES[h.status]
                  ? t(STATUS_NAMES[h.status])
                  : h.status;

                return (
                  <div
                    key={h.id}
                    className="relative flex gap-3 pb-4 last:pb-0"
                  >
                    {!isLast && (
                      <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-border/60" />
                    )}
                    <div className="relative z-10 mt-1 shrink-0">
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full ring-4 transition-all duration-300",
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
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-xs font-semibold tracking-tight",
                            colors.text,
                          )}
                        >
                          {statusLabel}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">
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
                      {h.previous_status && h.previous_status !== h.status ? (
                        <Typography.Muted className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                          {h.previous_status} {"->"} {statusLabel}
                        </Typography.Muted>
                      ) : null}
                      {h.notes ? (
                        <Typography.Muted className="mt-0.5 break-words rounded-lg border border-border/40 bg-muted/40 px-2.5 py-1.5 text-xs leading-relaxed text-muted-foreground">
                          {h.notes}
                        </Typography.Muted>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {hasServiceHistory ? (
            <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between gap-2">
                <Typography.Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("serviceHistory")}
                </Typography.Text>
                <Badge variant="secondary" className="text-[10px]">
                  {serviceHistory.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {serviceHistory.map((entry) => (
                  <div
                    key={entry.work_order_id}
                    className="rounded-lg border border-border/50 bg-background/50 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">
                        {entry.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {new Date(entry.created_at).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {entry.complaint ? (
                      <Typography.Muted className="mt-1 text-xs">
                        {entry.complaint}
                      </Typography.Muted>
                    ) : null}

                    {entry.services.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.services.map((service) => (
                          <Badge
                            key={`${entry.work_order_id}-${service.name}-${service.price}`}
                            variant="outline"
                            className="gap-1 text-[10px]"
                          >
                            <Wrench className="size-2.5" />
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      {entry.total > 0 ? (
                        <span className="font-medium text-foreground/80">
                          {entry.total.toLocaleString()} MNT
                        </span>
                      ) : null}
                      {entry.mechanic_name ? (
                        <span className="flex items-center gap-1">
                          <User className="size-2.5" />
                          {entry.mechanic_name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
