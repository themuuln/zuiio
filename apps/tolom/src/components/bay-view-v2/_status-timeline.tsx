"use client";

import {
  CheckCircle2,
  History,
  HistoryIcon,
  Package,
  User,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import type {
  WorkOrderServiceHistoryEntry,
  WorkOrderStatusHistory,
} from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import {
  STATUS_BORDER_LEFT,
  STATUS_DOT,
  STATUS_TRANSLATION_KEYS,
} from "./_constants";
import type { ServiceHistoryEntry } from "./_vehicle-registration-schema";

// ── Types ───────────────────────────────────────────────────

type StatusTimelineProps =
  | {
      mode: "status";
      statusHistory: WorkOrderStatusHistory[];
      serviceHistory: WorkOrderServiceHistoryEntry[];
      t: (key: string) => string;
    }
  | {
      mode: "service";
      history: ServiceHistoryEntry[];
    };

interface DedupedEntry {
  status: string;
  previous_status: string | null;
  first_at: string;
  last_at: string;
  count: number;
  notes: string | null;
  id: string;
}

// ── Constants ───────────────────────────────────────────────

const _STATUS_FLOW = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
];

const TIME_FORMAT = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
});

// ── Helpers ─────────────────────────────────────────────────

function formatTimeRange(isoStart: string, isoEnd: string): string {
  const start = new Date(isoStart);
  const end = new Date(isoEnd);
  return `${TIME_FORMAT.format(start)} \u2013 ${TIME_FORMAT.format(end)}`;
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

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return "одоо";
  if (min < 60) return `${min} мин өмнө`;
  if (hr < 24) return `${hr} цагийн өмнө`;
  if (day < 7) return `${day} өдрийн өмнө`;
  return formatDate(iso);
}

function deduplicateHistory(history: WorkOrderStatusHistory[]): DedupedEntry[] {
  // Sort ASC for grouping, then reverse for display
  const sorted = history.toSorted(
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

// ── Service entry renderer (mode="service") ─────────────────

function ServiceTimelineEntry({
  entry,
  isLast,
}: {
  entry: ServiceHistoryEntry;
  isLast: boolean;
}) {
  const _t = useTranslations("bayView");
  const dotColor = STATUS_DOT[entry.status] ?? "bg-slate-400";

  return (
    <div key={entry.work_order_id} className="relative flex gap-3 pb-4">
      {!isLast && (
        <div className="absolute left-3 top-5 bottom-0 w-0.5 bg-border" />
      )}

      <div className="relative z-10 mt-1 shrink-0">
        <div
          className={`size-5 ${dotColor} ring-2 ring-background flex items-center justify-center`}
        >
          {entry.status === "Completed" ? (
            <CheckCircle2 className="size-3 text-white" />
          ) : (
            <div className="size-2 bg-white dark:bg-gray-900" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold capitalize">
            {entry.status}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(entry.created_at)} {formatTime(entry.created_at)}
          </span>
        </div>

        {entry.complaint && (
          <Typography.Muted className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {entry.complaint}
          </Typography.Muted>
        )}

        {entry.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.services.map((s) => (
              <span
                key={`${s.name}-${s.price}`}
                className="inline-flex items-center gap-1 bg-info/10 px-2 py-1 text-xs font-medium text-info"
              >
                <Wrench className="size-3" />
                {s.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {entry.total > 0 && (
            <span className="font-medium text-foreground/80">
              {formatCurrency(entry.total)}
            </span>
          )}
          {entry.mechanic_name && (
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {entry.mechanic_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export function StatusTimeline(props: StatusTimelineProps) {
  // ── hooks must be at top level (no conditionals above) ──
  const tService = useTranslations("bayView");

  // ── mode = "service" ──
  if (props.mode === "service") {
    const { history } = props;

    if (history.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
          <HistoryIcon className="size-10 mb-2" />
          <Typography.Text className="text-sm">
            {tService("noServiceHistory")}
          </Typography.Text>
          <Typography.Text className="text-xs mt-1">
            {tService("serviceRecordsHere")}
          </Typography.Text>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0">
        {history.map((entry, idx) => (
          <ServiceTimelineEntry
            key={entry.work_order_id}
            entry={entry}
            isLast={idx === history.length - 1}
          />
        ))}
      </div>
    );
  }

  // ── mode = "status" ──
  const { statusHistory, serviceHistory, t } = props;
  const hasStatusHistory = (statusHistory ?? []).length > 0;
  const hasServiceHistory = (serviceHistory ?? []).length > 0;
  const deduped = hasStatusHistory ? deduplicateHistory(statusHistory) : [];

  return (
    <section className="rounded-xl bg-card/40 py-3">
      <div className="flex items-center gap-2 mb-3 px-3">
        <div className="flex items-center justify-center size-5 rounded-md bg-sky-500/10">
          <History className="size-3 text-sky-500" />
        </div>
        <h3
          id="status-timeline-title"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          {t("statusTimeline")}
        </h3>
      </div>

      {!hasStatusHistory && !hasServiceHistory ? (
        <div className="flex flex-col items-center justify-center py-5 px-3 text-muted-foreground/50">
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
            <div className="flex flex-col gap-0 px-3">
              {deduped.map((h, idx) => {
                const isFirst = idx === 0;
                const isDuped = h.count > 1;
                const statusLabel = STATUS_TRANSLATION_KEYS[h.status]
                  ? t(STATUS_TRANSLATION_KEYS[h.status])
                  : h.status;

                return (
                  <div
                    key={h.id}
                    style={{
                      borderLeftColor:
                        STATUS_BORDER_LEFT[h.status] ?? "#94a3b8",
                    }}
                    className={cn(
                      "flex items-baseline justify-between gap-2 py-1.5 border-l-2 pl-2.5 -ml-0.5",
                      isFirst ? "border-b border-border/40 pb-2.5 mb-0.5" : "",
                    )}
                  >
                    <span
                      className={cn(
                        "min-w-0 truncate",
                        isFirst
                          ? "text-sm font-semibold text-foreground"
                          : "text-sm text-muted-foreground",
                      )}
                    >
                      {statusLabel}
                      {isDuped && (
                        <Badge
                          variant="secondary"
                          className="ml-1.5 text-xs px-1 py-0 h-4 font-mono"
                        >
                          ×{h.count}
                        </Badge>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground/60 tabular-nums whitespace-nowrap">
                      {isDuped
                        ? `${formatRelativeTime(h.first_at)} · ${formatTimeRange(h.first_at, h.last_at)}`
                        : formatRelativeTime(h.first_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {hasServiceHistory ? (
            <div className="flex flex-col gap-3 border-t border-border/60 pt-3 px-3">
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
                    {/* Header: status + date */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">
                        {entry.status}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground/70">
                        {new Date(entry.created_at).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {entry.complaint ? (
                      <Typography.Muted className="mt-1.5 text-xs leading-relaxed">
                        {entry.complaint}
                      </Typography.Muted>
                    ) : null}

                    {/* Services */}
                    {entry.services.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          {t("services")}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.services.map((service, idx) => {
                            const nameLong = service.name.length > 15;
                            const badge = (
                              <span
                                key={`${entry.work_order_id}-${service.name}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-4xl border border-border text-foreground text-xs py-1 pl-1.5 pr-2 font-medium"
                              >
                                <span className="flex items-center justify-center size-4 rounded-full bg-info/10">
                                  <Wrench className="size-2.5 text-info" />
                                </span>
                                <span className="truncate max-w-[120px]">
                                  {service.name}
                                </span>
                                {service.price > 0 ? (
                                  <span className="font-mono text-muted-foreground/80 tabular-nums">
                                    {formatCurrency(service.price)}
                                  </span>
                                ) : null}
                              </span>
                            );
                            if (!nameLong) return badge;
                            return (
                              <Tooltip
                                key={`${entry.work_order_id}-${service.name}-${idx}`}
                              >
                                <TooltipTrigger>{badge}</TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-[200px]"
                                >
                                  <p className="text-xs">{service.name}</p>
                                  {service.price > 0 ? (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {formatCurrency(service.price)}
                                    </p>
                                  ) : null}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Parts */}
                    {entry.parts.length > 0 ? (
                      <div className="mt-2.5 flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          {t("parts")}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.parts.map((part, idx) => {
                            const nameLong = part.name.length > 15;
                            const badge = (
                              <span
                                key={`${entry.work_order_id}-${part.name}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-4xl border border-border/60 bg-muted/30 text-muted-foreground text-xs py-1 pl-1.5 pr-2"
                              >
                                <span className="flex items-center justify-center size-4 rounded-full bg-amber-500/10">
                                  <Package className="size-2.5 text-amber-500" />
                                </span>
                                <span className="truncate max-w-[120px]">
                                  {part.name}
                                </span>
                                {part.quantity > 1 ? (
                                  <span className="text-muted-foreground/60">
                                    ×{part.quantity}
                                  </span>
                                ) : null}
                                {part.price > 0 ? (
                                  <span className="font-mono text-muted-foreground/80 tabular-nums">
                                    {formatCurrency(part.price)}
                                  </span>
                                ) : null}
                              </span>
                            );
                            if (!nameLong) return badge;
                            return (
                              <Tooltip
                                key={`${entry.work_order_id}-${part.name}-${idx}`}
                              >
                                <TooltipTrigger>{badge}</TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-[200px]"
                                >
                                  <p className="text-xs">{part.name}</p>
                                  {part.price > 0 ? (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {part.quantity > 1
                                        ? `${part.quantity} × `
                                        : ""}
                                      {formatCurrency(part.price)}
                                    </p>
                                  ) : null}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Footer: total + assignees */}
                    <div className="mt-3 flex items-end justify-between gap-2 border-t border-border/30 pt-2.5">
                      {entry.total > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 whitespace-nowrap">
                            {t("workOrderTotal")}
                          </span>
                          <span className="font-semibold text-foreground/90 tabular-nums">
                            {formatCurrency(entry.total)}
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        {entry.mechanic_name ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/80">
                            <User className="size-3 text-muted-foreground/50" />
                            {entry.mechanic_name}
                          </span>
                        ) : null}
                        {entry.helpers.length > 0 ? (
                          <TooltipProvider delay={200}>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                                  +{entry.helpers.length}
                                  <span className="hidden sm:inline">
                                    {entry.helpers.length === 1
                                      ? "helper"
                                      : "helpers"}
                                  </span>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {entry.helpers
                                  .map((h) => h.full_name ?? "Unknown")
                                  .join(", ")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : null}
                      </div>
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
