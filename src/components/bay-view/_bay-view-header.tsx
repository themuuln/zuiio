"use client";

import {
  Car,
  CarFront,
  History,
  KeyRound,
  LayoutDashboard,
  Loader2,
  UserCheck,
  UserPlus,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BayViewToolbar,
  type ColumnsMode,
  type ViewMode,
} from "./bay-view-toolbar";

interface BayViewHeaderProps {
  bayCount: number;
  baysWithWork: number;
  activeMechanics: number;
  waitingCount: number;
  userIsMechanic: boolean;
  myJobsOnly: boolean;
  isRefreshing: boolean;
  hasPendingOps: boolean;
  seeding: boolean;
  confirmSeed: boolean;
  viewMode: ViewMode;
  columns: ColumnsMode;
  onMyJobsToggle: () => void;
  onRefresh: () => void;
  onBayCountChange: (count: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onColumnsChange: (mode: ColumnsMode) => void;
  onShowVehicleReg: () => void;
  onShowMechanicReg: () => void;
  onShowServiceLookup: () => void;
  onShowShiftReport: () => void;
  onShowPinSettings: () => void;
  onSeedQueue: () => void;
  onConfirmSeed: () => void;
  onCancelSeed: () => void;
}

export function BayViewHeader({
  bayCount,
  baysWithWork,
  activeMechanics,
  waitingCount,
  userIsMechanic,
  myJobsOnly,
  isRefreshing,
  hasPendingOps,
  seeding,
  confirmSeed,
  viewMode,
  columns,
  onMyJobsToggle,
  onRefresh,
  onBayCountChange,
  onViewModeChange,
  onColumnsChange,
  onShowVehicleReg,
  onShowMechanicReg,
  onShowServiceLookup,
  onShowShiftReport,
  onShowPinSettings,
  onSeedQueue,
  onConfirmSeed,
  onCancelSeed,
}: BayViewHeaderProps) {
  const t = useTranslations("bayView");

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border/50 py-1">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold tracking-tight">{t("title")}</h1>
          {userIsMechanic && (
            <button
              type="button"
              onClick={onMyJobsToggle}
              className={cn(
                "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                myJobsOnly
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted",
              )}
            >
              {myJobsOnly ? (
                <UserCheck className="size-2.5" />
              ) : (
                <UserPlus className="size-2.5" />
              )}
              {myJobsOnly ? t("myJobs") : t("allJobs")}
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onShowVehicleReg}
                    className="flex items-center justify-center size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  />
                }
              >
                <Car className="size-2.5" />
              </TooltipTrigger>
              <TooltipContent>{t("registerVehicle")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onShowMechanicReg}
                    className="flex items-center justify-center size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  />
                }
              >
                <Wrench className="size-2.5" />
              </TooltipTrigger>
              <TooltipContent>{t("registerMechanic")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onShowServiceLookup}
                    className="flex items-center justify-center size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  />
                }
              >
                <History className="size-2.5" />
              </TooltipTrigger>
              <TooltipContent>{t("serviceHistory")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onShowShiftReport}
                    className="flex items-center justify-center size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  />
                }
              >
                <LayoutDashboard className="size-2.5" />
              </TooltipTrigger>
              <TooltipContent>{t("shiftReport")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onShowPinSettings}
                    className="flex items-center justify-center size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  />
                }
              >
                <KeyRound className="size-2.5" />
              </TooltipTrigger>
              <TooltipContent>{t("bayPinSettings")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="mx-1 h-4 w-px bg-border/60" />

          <BayViewToolbar
            bayCount={bayCount}
            onRefresh={onRefresh}
            onBayCountChange={onBayCountChange}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            columns={columns}
            onColumnsChange={onColumnsChange}
          />

          {(isRefreshing || hasPendingOps) && (
            <div className="ml-1 flex items-center gap-1 rounded bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {hasPendingOps ? (
                <Loader2 className="size-2.5 animate-spin" />
              ) : (
                <span className="size-1 rounded-full bg-primary animate-pulse" />
              )}
              {hasPendingOps ? t("saving") : t("refreshing")}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border/50 py-1">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-0.5">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/50" />
            {t("baysActive")}{" "}
            <strong className="text-foreground">
              {baysWithWork}/{bayCount}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-0.5">
            <span className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_6px] shadow-blue-400/50" />
            {t("mechanicsWorking")}{" "}
            <strong className="text-foreground">{activeMechanics}</strong>
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5",
              waitingCount > 5
                ? "bg-amber-100/80 dark:bg-amber-900/20"
                : "bg-muted/40",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                waitingCount > 5
                  ? "bg-amber-500 shadow-[0_0_6px] shadow-amber-500/50"
                  : "bg-muted-foreground/50",
              )}
            />
            {t("inQueue")}{" "}
            <strong
              className={cn(
                waitingCount > 5
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-foreground",
              )}
            >
              {waitingCount}
            </strong>
          </span>
        </div>

        {confirmSeed ? (
          <div className="flex items-center gap-1 rounded border border-border/60 bg-muted/30 px-1.5 py-0.5">
            <span className="text-[9px] text-muted-foreground">
              {t("addDemoVehicles")}
            </span>
            <button
              type="button"
              onClick={onConfirmSeed}
              disabled={seeding}
              className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {seeding ? t("adding") : t("confirm")}
            </button>
            <button
              type="button"
              onClick={onCancelSeed}
              className="rounded border border-border px-1.5 py-0.5 text-[9px] font-medium hover:bg-muted"
            >
              {t("cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSeedQueue}
            disabled={seeding}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <CarFront className="size-3" />
            <span className="hidden sm:inline">
              {seeding ? t("adding") : t("seedQueue")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
