"use client";

import {
  Building2,
  Car,
  CheckCircle2,
  Columns3,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  List,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "kanban" | "list";

const VIEW_OPTIONS: {
  mode: ViewMode;
  icon: typeof LayoutGrid;
  labelKey: string;
}[] = [
  { mode: "grid", icon: LayoutGrid, labelKey: "gridView" },
  { mode: "kanban", icon: Columns3, labelKey: "kanbanView" },
  { mode: "list", icon: List, labelKey: "listView" },
];

interface BranchPill {
  id: string;
  name: string;
}

interface ToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  userIsMechanic: boolean | null | undefined;
  myJobsOnly: boolean;
  setMyJobsOnly: (v: boolean) => void;
  fetchData: (showLoader: boolean) => Promise<void>;
  baySearchQuery: string;
  setBaySearchQuery: (v: string) => void;
  readyWosCount: number;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  batchCompletePending: boolean;
  setBatchCompleteDialogOpen: (v: boolean) => void;
  setShowVehicleReg: (v: boolean) => void;
  setShowMechanicReg: (v: boolean) => void;
  setShowShiftReport: (v: boolean) => void;
  setShowPinSettings: (v: boolean) => void;
  bayCountMutationInFlightRef: React.MutableRefObject<boolean>;
  bayCountDebounceRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
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
}

export function Toolbar({
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
  setShowMechanicReg,
  setShowShiftReport,
  setShowPinSettings,
  bayCountMutationInFlightRef,
  bayCountDebounceRef,
  bayCountPending,
  bayCountInputValue,
  setBayCountInputValue,
  applyBayCountChange,
  bayCount,
  branches,
  selectedBranchId,
  onBranchChange,
}: ToolbarProps) {
  return (
    <div className="flex-shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-md p-3 select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Controls (View Selector, Branch Pills, Filter, Refresh) — search takes remaining space */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:min-w-0 sm:flex-nowrap">
          {/* Branch pills */}
          {branches.length > 1 && (
            <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/40 p-0.5 shadow-sm h-8">
              {/* All pill */}
              <button
                type="button"
                onClick={() => onBranchChange("all")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all cursor-pointer h-full ${
                  selectedBranchId === "all"
                    ? "bg-background text-foreground shadow-sm font-bold border border-border/30"
                    : "text-muted-foreground/80 hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Building2 className="size-3.5" />
                <span className="hidden sm:inline text-[11px]">All</span>
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onBranchChange(b.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all cursor-pointer h-full ${
                    selectedBranchId === b.id
                      ? "bg-background text-foreground shadow-sm font-bold border border-border/30"
                      : "text-muted-foreground/80 hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Building2 className="size-3.5" />
                  <span className="hidden sm:inline text-[11px]">{b.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Segmented view selector */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/40 p-0.5 shadow-sm h-8">
            {VIEW_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = viewMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setViewMode(opt.mode)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all cursor-pointer h-full",
                    isActive
                      ? "bg-background text-foreground shadow-sm font-bold border border-border/30"
                      : "text-muted-foreground/80 hover:bg-muted/70 hover:text-foreground",
                  )}
                  title={t(opt.labelKey)}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden md:inline text-[11px]">
                    {t(opt.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* My Jobs Filter Toggle */}
          {userIsMechanic && (
            <Button
              type="button"
              size="sm"
              variant={myJobsOnly ? "default" : "outline"}
              onClick={() => setMyJobsOnly(!myJobsOnly)}
              className={cn(
                "h-8 rounded-lg text-xs font-semibold cursor-pointer border-border/50 shadow-sm",
                myJobsOnly
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "hover:bg-accent hover:text-foreground text-muted-foreground",
              )}
            >
              {myJobsOnly ? t("myJobs") : t("allJobs")}
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fetchData(true)}
            title={t("refresh")}
            className="rounded-lg border-border/50 text-muted-foreground shadow-sm hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
          </Button>

          {/* Search Bar — takes remaining space */}
          <div className="relative flex-1 min-w-[140px] max-w-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              type="text"
              value={baySearchQuery}
              onChange={(e) => setBaySearchQuery(e.target.value)}
              placeholder="Search plate, make, model..."
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
        </div>

        {/* Right Controls (Action Buttons & Bay Count) */}
        <div className="flex flex-wrap items-center gap-3 sm:flex-shrink-0">
          {/* Batch Complete Button — only when 2+ ready items */}
          {readyWosCount >= 2 && (
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={batchCompletePending}
              onClick={() => setBatchCompleteDialogOpen(true)}
              className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 cursor-pointer"
            >
              {batchCompletePending ? (
                <Spinner className="size-3.5" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              {batchCompletePending
                ? t("batchCompleteProcessing")
                : t("batchComplete", { count: readyWosCount })}
            </Button>
          )}

          {/* Quick Admin Actions Box */}
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card px-1 shadow-sm h-8">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setShowVehicleReg(true)}
                    className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                  />
                }
              >
                <Car className="size-4" />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-[11px] font-semibold"
              >
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
                    onClick={() => setShowMechanicReg(true)}
                    className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                  />
                }
              >
                <Wrench className="size-4" />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-[11px] font-semibold"
              >
                {t("registerMechanic")}
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
                    className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                  />
                }
              >
                <LayoutDashboard className="size-4" />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-[11px] font-semibold"
              >
                {t("shiftReport")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setShowPinSettings(true)}
                    className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                  />
                }
              >
                <KeyRound className="size-4" />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-[11px] font-semibold"
              >
                {t("bayPinSettings")}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Digital Bay Counter */}
          <div className="flex items-center gap-1.5 border border-border/50 bg-card rounded-lg p-0.5 pr-2.5 pl-1.5 shadow-sm h-8">
            <span className="text-[10px] font-mono font-black text-muted-foreground/75 uppercase tracking-wider px-1 select-none">
              Bays
            </span>
            <div className="flex items-center gap-0.5 rounded border border-border/40 bg-muted/20 p-0.5 h-full">
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={async () => {
                  if (bayCountMutationInFlightRef.current) return;
                  const next = Math.max(1, bayCount - 1);
                  if (next === bayCount) return;
                  setBayCountInputValue(next);
                  await applyBayCountChange(next);
                }}
                disabled={bayCountPending || bayCount <= 1}
                className="size-5 rounded hover:bg-background cursor-pointer text-muted-foreground"
              >
                <Minus className="size-2.5" />
              </Button>
              <input
                type="number"
                min={1}
                max={50}
                value={bayCountInputValue}
                onChange={(e) => {
                  const raw = e.target.value;
                  setBayCountInputValue(raw);
                  const next = parseInt(raw, 10);
                  if (Number.isNaN(next) || next < 1 || next > 50) return;

                  if (bayCountDebounceRef.current)
                    clearTimeout(bayCountDebounceRef.current);
                  bayCountDebounceRef.current = setTimeout(() => {
                    applyBayCountChange(next);
                  }, 500);
                }}
                onBlur={() => {
                  if (bayCountDebounceRef.current) {
                    clearTimeout(bayCountDebounceRef.current);
                    bayCountDebounceRef.current = null;
                  }
                  const next = parseInt(String(bayCountInputValue), 10);
                  if (Number.isNaN(next) || next < 1 || next > 50) {
                    setBayCountInputValue(bayCount);
                    return;
                  }
                  applyBayCountChange(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                disabled={bayCountPending}
                className="h-5 w-7 bg-transparent border-0 text-center text-xs font-bold font-mono text-foreground focus:outline-none focus:ring-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={async () => {
                  if (bayCountMutationInFlightRef.current) return;
                  const next = Math.min(50, bayCount + 1);
                  if (next === bayCount) return;
                  setBayCountInputValue(next);
                  await applyBayCountChange(next);
                }}
                disabled={bayCountPending || bayCount >= 50}
                className="size-5 rounded hover:bg-background cursor-pointer text-muted-foreground"
              >
                <Plus className="size-2.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
