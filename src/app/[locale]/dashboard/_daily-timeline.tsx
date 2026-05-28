"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimelineEvent } from "@/lib/services/report-service";
import { Typography } from "@/components/ui/typography";

const STATUS_DOT: Record<string, string> = {
  New: "bg-blue-500",
  Diagnosing: "bg-yellow-500",
  "In Progress": "bg-orange-500",
  "Ready for Pickup": "bg-green-500",
  Completed: "bg-emerald-600",
  Cancelled: "bg-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  New: "New",
  Diagnosing: "Diagnosing",
  "In Progress": "In Progress",
  "Ready for Pickup": "Ready",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function DailyTimeline({ orgId }: { orgId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = useCallback(
    async (signal?: AbortSignal) => {
      if (!orgId) return;
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/reports?type=timeline`,
          { signal },
        );
        const d = await res.json();
        setEvents(d.data ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [orgId],
  );

  useEffect(() => {
    const abort = new AbortController();
    loadTimeline(abort.signal);
    return () => abort.abort();
  }, [loadTimeline]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="size-4" />
            Today's Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={`skeleton-${i}`} className="flex gap-3">
                <Skeleton className="size-2.5 rounded-full mt-1 shrink-0" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="size-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Clock className="size-4" />
          Today's Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex relative pl-4 border-l-2 border-muted flex-col gap-0">
          {events.slice(0, 15).map((event) => (
            <div key={event.id} className="relative pb-4 last:pb-0">
              <div
                className={`absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-background ${STATUS_DOT[event.status] ?? "bg-muted"}`}
              />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/work-orders/${event.workOrderId}`}
                    className="text-xs font-medium truncate hover:underline"
                  >
                    {event.vehiclePlate ?? "—"} · {event.customerName ?? "—"}
                  </Link>
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                    {formatTime(event.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 font-normal"
                  >
                    {STATUS_LABEL[event.status] ?? event.status}
                  </Badge>
                  {event.bayNumber != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Bay {event.bayNumber}
                    </span>
                  )}
                </div>
                {event.notes && (
                  <Typography.Muted className="text-[10px] text-muted-foreground line-clamp-1">
                    {event.notes}
                  </Typography.Muted>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
