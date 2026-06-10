"use client";

import React from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ShiftReport } from "@/lib/services/bay-view-service";
import { cn, formatMNT } from "@/lib/utils";

interface TrendDelta {
  bayUtilization: number;
  activeJobs: number;
  completedToday: number;
  revenueToday: number;
  revenuePerLaborHour: number;
}

interface KpiCardsProps {
  shiftReport: ShiftReport | null;
  trendDelta: TrendDelta | null;
  occupiedBays: number;
  bayCount: number;
  waitingQueueLength: number;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export const KpiCards = React.memo(function KpiCards({
  shiftReport,
  trendDelta,
  occupiedBays,
  bayCount,
  waitingQueueLength,
  t,
}: KpiCardsProps) {
  return (
    <div className="px-5 py-2 shrink-0">
      <div className="flex flex-col lg:flex-row">
        {/* Card 1: Bay Utilization */}
        <Card className="bg-transparent border-none ring-0 shadow-none px-4 py-3 gap-0 flex flex-col rounded-none flex-1 min-w-0">
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
        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Card 2: Active Workloads */}
        <Card className="bg-transparent border-none ring-0 shadow-none px-4 py-3 gap-0 flex flex-col rounded-none flex-1 min-w-0">
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
        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Card 3: Completed Today */}
        <Card className="bg-transparent border-none ring-0 shadow-none px-4 py-3 gap-0 flex flex-col rounded-none flex-1 min-w-0">
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
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium mt-1">
            <Clock className="size-3" /> Avg{" "}
            {Number.isFinite(shiftReport?.avgDurationMinutes)
              ? (shiftReport?.avgDurationMinutes ?? 0)
              : 0}
            m
          </span>
        </Card>
        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Card 4: Revenue / Labor Hour */}
        <Card className="bg-transparent border-none ring-0 shadow-none px-4 py-3 gap-0 flex flex-col rounded-none flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Rev / Labor Hr
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatMNT(
                Number.isFinite(shiftReport?.revenuePerLaborHour)
                  ? (shiftReport?.revenuePerLaborHour ?? 0)
                  : 0,
              )}
              {trendDelta && trendDelta.revenuePerLaborHour !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold ml-2",
                    trendDelta.revenuePerLaborHour > 0
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  {trendDelta.revenuePerLaborHour > 0 ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  )}
                  {formatMNT(Math.abs(trendDelta.revenuePerLaborHour || 0))}
                </span>
              )}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium mt-1">
            {formatMNT(shiftReport?.revenueToday ?? 0)} total today
          </span>
        </Card>
        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Card 5: Waiting Queue */}
        <Card className="bg-transparent border-none ring-0 shadow-none px-4 py-3 gap-0 flex flex-col rounded-none flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              {t("waitingQueue")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
              <Users className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tracking-tight">
              {waitingQueueLength}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              waiting
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium mt-1">
            {shiftReport?.activeJobs ?? 0} jobs in progress
          </span>
        </Card>
      </div>
    </div>
  );
});
