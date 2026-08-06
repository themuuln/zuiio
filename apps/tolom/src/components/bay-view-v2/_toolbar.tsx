"use client";

import {
  Car,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  List,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { cn } from "@/lib/utils";
import { BayCounter } from "./_bay-counter";
import { type BranchPill, BranchPills } from "./_branch-pills";
import { StatusFilter } from "./_status-filter";
import type { ViewMode } from "./_types";
import { ViewSelector } from "./_view-selector";

interface ToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  userIsMechanic: boolean | null | undefined;
  myJobsOnly: boolean;
  setMyJobsOnly: (v: boolean) => void;
  fetchData: () => Promise<void>;
  baySearchQuery: string;
  setBaySearchQuery: (v: string) => void;
  readyWosCount: number;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  batchCompletePending: boolean;
  setBatchCompleteDialogOpen: (v: boolean) => void;
  setShowVehicleReg: (v: boolean) => void;
  setShowShiftReport: (v: boolean) => void;
  bayCountMutationInFlightRef: React.MutableRefObject<boolean>;
  bayCountPending: boolean;
  bayCountInputValue: number | string;
  setBayCountInputValue: (v: number | string) => void;
  applyBayCountChange: (next: number) => Promise<void>;
  bayCount: number;
  /** All branches for the branch pills */
  branches: BranchPill[];
  /** Currently selected branch id, or "all" */
  selectedBranchId: string;
  /** Called when a branch pill is clicked */
  onBranchChange: (branchId: string) => void;
  /** Status filter — null means "All" */
  statusFilter: string | null;
  /** Show the queue rail */
  showQueueRail: boolean;
  /** Toggle the queue rail */
  onToggleQueue: () => void;
  setStatusFilter: (v: string | null) => void;
  /** Bay slot data for occupancy validation */
  bays: BaySlotData[];
}

export const Toolbar = React.memo(function Toolbar({
  viewMode,
  setViewMode,
  userIsMechanic,
  myJobsOnly,
  setMyJobsOnly,
  fetchData,

  baySearchQuery,
  setBaySearchQuery,
  readyWosCount,
  t,
  batchCompletePending,
  setBatchCompleteDialogOpen,
  setShowVehicleReg,
  setShowShiftReport,
  bayCountMutationInFlightRef,
  bayCountPending,
  bayCountInputValue,
  setBayCountInputValue,
  applyBayCountChange,
  bayCount,
  branches,
  selectedBranchId,
  onBranchChange,
  statusFilter,
  setStatusFilter,
  showQueueRail,
  onToggleQueue,
  bays,
}: ToolbarProps) {
  const [toolbarExpanded, setToolbarExpanded] = React.useState(false);
  return (
    <div
      data-slot="bay-view-toolbar"
      className="sticky top-0 z-40 flex-shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-md px-3 py-1.5 select-none"
    >
      {/* Primary row — always visible */}
      <div className="flex items-center gap-2 flex-wrap">
        <BranchPills
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={onBranchChange}
          t={t}
        />

        {/* Segmented view selector */}
        <ViewSelector viewMode={viewMode} setViewMode={setViewMode} t={t} />

        {/* Search Bar — takes remaining space */}
        <div className="relative flex-1 min-w-[140px] max-w-none">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            type="text"
            value={baySearchQuery}
            onChange={(e) => setBaySearchQuery(e.target.value)}
            placeholder={t("queueSearchPlaceholder")}
            className="h-8 pl-7 pr-7 text-xs"
          />
          {baySearchQuery && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setBaySearchQuery("")}
              className="absolute right-0.5 top-1/2 size-6 -translate-y-1/2 p-0 text-muted-foreground/50"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        {/* My Jobs Filter Toggle — always visible for mechanics */}
        {userIsMechanic && (
          <Button
            type="button"
            size="sm"
            variant={myJobsOnly ? "default" : "outline"}
            onClick={() => setMyJobsOnly(!myJobsOnly)}
            className={cn(
              "h-8 rounded-lg text-xs font-semibold cursor-pointer border-border/50",
              myJobsOnly
                ? "bg-primary text-primary-foreground hover:opacity-85"
                : "hover:bg-accent hover:text-foreground text-muted-foreground",
            )}
          >
            {myJobsOnly ? t("myJobs") : t("allJobs")}
          </Button>
        )}

        {/* Expand/Collapse Toggle */}
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={() => setToolbarExpanded(!toolbarExpanded)}
          className="size-7 rounded-md text-muted-foreground/60 hover:text-foreground cursor-pointer"
          aria-label={toolbarExpanded ? "Collapse toolbar" : "Expand toolbar"}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              toolbarExpanded && "rotate-180",
            )}
          />
        </Button>
      </div>

      {/* Secondary row — collapsible */}
      <div
        className={cn(
          "transition-[max-height,opacity] duration-200 ease-out",
          toolbarExpanded
            ? "max-h-32 opacity-100 mt-2"
            : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <StatusFilter
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            t={t}
          />

          {/* Refresh Button */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fetchData()}
            title={t("refresh")}
            aria-label={t("refresh")}
            className="rounded-lg border-border/50 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="size-4" />
          </Button>

          {/* Queue Rail Toggle */}
          <Button
            type="button"
            size="sm"
            variant={showQueueRail ? "default" : "outline"}
            onClick={onToggleQueue}
            className={cn(
              "h-8 gap-1.5 rounded-lg text-xs font-semibold cursor-pointer border-border/50",
              showQueueRail
                ? "bg-primary text-primary-foreground hover:opacity-85"
                : "hover:bg-accent hover:text-foreground text-muted-foreground",
            )}
          >
            <List className="size-4" />
            Queue
          </Button>

          {/* Batch Complete Button — only when 2+ ready items */}
          {readyWosCount >= 2 && (
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={batchCompletePending}
              onClick={() => setBatchCompleteDialogOpen(true)}
              className="h-8 gap-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
            >
              {batchCompletePending ? (
                <Spinner className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {batchCompletePending
                ? t("batchCompleteProcessing")
                : t("batchComplete", { count: readyWosCount })}
            </Button>
          )}

          {/* Quick Admin Actions Box */}
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card px-1 h-8">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setShowVehicleReg(true)}
                    aria-label={t("registerVehicle")}
                    className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                  />
                }
              >
                <Car className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                {t("registerVehicle")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setShowShiftReport(true)}
                    aria-label={t("shiftReport")}
                    className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                  />
                }
              >
                <LayoutDashboard className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                {t("shiftReport")}
              </TooltipContent>
            </Tooltip>
          </div>

          <BayCounter
            bayCount={bayCount}
            bayCountInputValue={bayCountInputValue}
            setBayCountInputValue={setBayCountInputValue}
            bayCountPending={bayCountPending}
            applyBayCountChange={applyBayCountChange}
            bayCountMutationInFlightRef={bayCountMutationInFlightRef}
            bays={bays}
            t={t}
          />
        </div>
      </div>
    </div>
  );
});
