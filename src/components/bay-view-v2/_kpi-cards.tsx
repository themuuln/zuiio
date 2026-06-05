"use client";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Wallet,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ShiftReport } from "@/lib/services/bay-view-service";
import { cn, formatMNT } from "@/lib/utils";

interface TrendDelta {
  bayUtilization: number;
  activeJobs: number;
  completedToday: number;
  revenueToday: number;
}

interface KpiCardsProps {
  shiftReport: ShiftReport | null;
  trendDelta: TrendDelta | null;
  occupiedBays: number;
  bayCount: number;
  waitingQueueLength: number;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export function KpiCards({
  shiftReport,
  trendDelta,
  occupiedBays,
  bayCount,
  waitingQueueLength,
  t,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 shrink-0 bg-muted/10 border-b border-border/40">
      {/* Card 1: Bay Utilization */}
      <Card className="bg-card/65 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 p-3 gap-0 flex flex-col rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            {t("bayUtilization")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <Activity className="size-4" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold font-mono tracking-tight">
            {shiftReport?.bayUtilization ?? 0}%
            {trendDelta && trendDelta.bayUtilization !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                  trendDelta.bayUtilization > 0
                    ? "text-emerald-500"
                    : "text-red-500",
                )}
              >
                {trendDelta.bayUtilization > 0 ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {Math.abs(trendDelta.bayUtilization)}%
              </span>
            )}
          </span>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${shiftReport?.bayUtilization ?? 0}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {occupiedBays} of {bayCount} bays occupied
        </span>
      </Card>

      {/* Card 2: Active Workloads */}
      <Card className="bg-card/65 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 p-3 gap-0 flex flex-col rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            {t("activeJobs")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
            <Wrench className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold font-mono tracking-tight">
            {shiftReport?.activeJobs ?? 0}
            {trendDelta && trendDelta.activeJobs !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                  trendDelta.activeJobs > 0
                    ? "text-emerald-500"
                    : "text-red-500",
                )}
              >
                {trendDelta.activeJobs > 0 ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {Math.abs(trendDelta.activeJobs)}
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            active
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium mt-1">
          +{waitingQueueLength} in waiting queue
        </span>
      </Card>

      {/* Card 3: Completed Today */}
      <Card className="bg-card/65 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 p-3 gap-0 flex flex-col rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            {t("completedToday")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold font-mono tracking-tight">
            {shiftReport?.completedToday ?? 0}
            {trendDelta && trendDelta.completedToday !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                  trendDelta.completedToday > 0
                    ? "text-emerald-500"
                    : "text-red-500",
                )}
              >
                {trendDelta.completedToday > 0 ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {Math.abs(trendDelta.completedToday)}
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            completed
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium mt-1">
          Avg duration: {shiftReport?.avgDurationMinutes ?? 0}m
        </span>
      </Card>

      {/* Card 4: Revenue Today */}
      <Card className="bg-card/65 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 p-3 gap-0 flex flex-col rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            {t("revenueToday")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
            <Wallet className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatMNT(shiftReport?.revenueToday ?? 0)}
            {trendDelta && trendDelta.revenueToday !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                  trendDelta.revenueToday > 0
                    ? "text-emerald-500"
                    : "text-red-500",
                )}
              >
                {trendDelta.revenueToday > 0 ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {formatMNT(Math.abs(trendDelta.revenueToday))}
              </span>
            )}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium mt-1">
          Today&apos;s invoices paid
        </span>
      </Card>
    </div>
  );
}
