"use client";

import { CheckCircle2, History, RotateCcw, User, Wrench } from "lucide-react";
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

interface DedupedEntry {
  status: string;
  previous_status: string | null;
  first_at: string;
  last_at: string;
  count: number;
  notes: string | null;
  id: string;
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

const STATUS_FLOW = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
];

function isForwardTransition(
  status: string,
  previousStatus: string | null,
): boolean {
  if (!previousStatus) return true;
  const toIdx = STATUS_FLOW.indexOf(status);
  const fromIdx = STATUS_FLOW.indexOf(previousStatus);
  if (toIdx === -1 || fromIdx === -1) return true;
  return toIdx > fromIdx;
}

function formatTimeRange(isoStart: string, isoEnd: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
  const start = new Date(isoStart);
  const end = new Date(isoEnd);
  const fmt = new Intl.DateTimeFormat([], opts);
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deduplicateHistory(history: WorkOrderStatusHistory[]): DedupedEntry[] {
  // Sort ASC for grouping, then reverse for display
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const result: DedupedEntry[] = [];
  for (const entry of sorted) {
    const prev = result[result.length - 1];
    if (
      prev &&
      prev.status === entry.status &&
      prev.previous_status === entry.previous_status
    ) {
      prev.last_at = entry.created_at;
      prev.count++;
      if (entry.notes) prev.notes = entry.notes;
    } else {
      result.push({
        status: entry.status,
        previous_status: entry.previous_status,
        first_at: entry.created_at,
        last_at: entry.created_at,
        count: 1,
        notes: entry.notes,
        id: entry.id,
      });
    }
  }

  return result.reverse();
}

export function StatusTimeline({
  statusHistory,
  serviceHistory,
  t,
}: StatusTimelineProps) {
  const hasStatusHistory = (statusHistory ?? []).length > 0;
  const hasServiceHistory = (serviceHistory ?? []).length > 0;
  const deduped = hasStatusHistory ? deduplicateHistory(statusHistory) : [];

  return (
    <section
      aria-labelledby="status-timeline-title"
      className="rounded-lg border border-border/60 bg-card/40 p-3"
    >
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center gap-2">
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
        <p className="text-xs text-muted-foreground/60 leading-normal pl-1">
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
              {deduped.map((h, idx) => {
                const isLast = idx === deduped.length - 1;
                const colors = STATUS_COLORS[h.status] ?? {
                  dot: "bg-slate-500 ring-slate-500/20",
                  text: "text-slate-600 dark:text-slate-400",
                };
                const statusLabel = STATUS_NAMES[h.status]
                  ? t(STATUS_NAMES[h.status])
                  : h.status;
                const forward = isForwardTransition(
                  h.status,
                  h.previous_status,
                );
                const isBackward = !forward && h.previous_status !== null;
                const isDuped = h.count > 1;

                return (
                  <div
                    key={h.id}
                    className="relative flex gap-3 pb-4 last:pb-0"
                  >
                    {!isLast && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border/60" />
                    )}
                    <div className="relative z-10 mt-1 shrink-0">
                      {isBackward ? (
                        // Backwards: dashed orange-tinted ring
                        <div
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full ring-4 ring-orange-400/20 border border-dashed border-orange-400/60 transition-all duration-300",
                          )}
                        >
                          <RotateCcw className="size-3 text-orange-500" />
                        </div>
                      ) : (
                        // Forward: solid colored dot
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
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-xs font-semibold tracking-tight",
                            isBackward
                              ? "text-orange-600 dark:text-orange-400"
                              : colors.text,
                          )}
                        >
                          {statusLabel}
                          {isDuped && (
                            <Badge
                              variant="secondary"
                              className="ml-1.5 text-xs px-1 py-1 h-4 font-mono"
                            >
                              ×{h.count}
                            </Badge>
                          )}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground/60">
                          {formatDate(h.first_at)}
                          {isDuped
                            ? ` ${formatTimeRange(h.first_at, h.last_at)}`
                            : ` ${formatTime(h.first_at)}`}
                        </span>
                      </div>
                      {h.previous_status && h.previous_status !== h.status ? (
                        <Typography.Muted
                          className={cn(
                            "text-xs uppercase tracking-wide",
                            isBackward
                              ? "text-orange-500/70 dark:text-orange-400/60"
                              : "text-muted-foreground/70",
                          )}
                        >
                          {isBackward && (
                            <RotateCcw className="inline size-3 mr-1 -mt-px" />
                          )}
                          {h.previous_status} {"→"} {statusLabel}
                        </Typography.Muted>
                      ) : null}
                      {h.notes ? (
                        <Typography.Muted className="mt-1 break-words rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
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
                <Badge variant="secondary" className="text-xs">
                  {serviceHistory.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {serviceHistory.map((entry) => (
                  <div
                    key={entry.work_order_id}
                    className="rounded-lg border border-border/50 bg-background/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">
                        {entry.status}
                      </span>
                      <span className="text-xs text-muted-foreground/70">
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
                            className="gap-1 text-xs"
                          >
                            <Wrench className="size-3" />
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {entry.total > 0 ? (
                        <span className="font-medium text-foreground/80">
                          {entry.total.toLocaleString()} MNT
                        </span>
                      ) : null}
                      {entry.mechanic_name ? (
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {entry.mechanic_name}
                        </span>
                      ) : null}
                      {entry.helpers.length > 0 ? (
                        <span className="flex items-center gap-1 text-muted-foreground/70">
                          +{entry.helpers.length} helper
                          {entry.helpers.length > 1 ? "s" : ""}
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
