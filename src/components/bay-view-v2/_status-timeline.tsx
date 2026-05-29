"use client";

import { CheckCircle2, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkOrderStatusHistory } from "@/lib/types";
import { StatusPill } from "./status-pill";
import { Typography } from "@/components/ui/typography";

interface StatusTimelineProps {
  statusHistory: WorkOrderStatusHistory[];
  t: (key: string) => string;
}

export function StatusTimeline({ statusHistory, t }: StatusTimelineProps) {
  return (
    <section className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex items-center justify-center size-5 rounded-md bg-purple-500/10">
          <History className="size-3 text-purple-500" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("statusTimeline")}
        </span>
      </div>

      {(statusHistory ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground/50">
          <History className="size-5 mb-1.5 opacity-60" />
          <Typography.Text className="text-xs">
            {t("noHistoryYet")}
          </Typography.Text>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {statusHistory?.map((h, idx) => {
            const isLast = idx === (statusHistory?.length ?? 0) - 1;
            return (
              <div key={h.id} className="relative flex gap-2 pb-3 last:pb-0">
                {!isLast && (
                  <div className="absolute left-[10px] top-5 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
                )}
                <div className="relative z-10 mt-1 shrink-0">
                  <div
                    className={cn(
                      "size-5 rounded-full ring-2 ring-background flex items-center justify-center",
                      h.status === "Completed"
                        ? "bg-green-500"
                        : h.status === "Cancelled"
                          ? "bg-red-400"
                          : h.status === "In Progress" ||
                              h.status === "Ready for Pickup"
                            ? "bg-amber-500"
                            : "bg-blue-500",
                    )}
                  >
                    {h.status === "Completed" ||
                    h.status === "Ready for Pickup" ? (
                      <CheckCircle2 className="size-3 text-white" />
                    ) : (
                      <div className="size-2 rounded-full bg-white/80" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill status={h.status} />
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
                    <Typography.Muted className="text-xs text-muted-foreground mt-1 bg-muted/30 rounded-md px-2 py-1 border border-border/40">
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
