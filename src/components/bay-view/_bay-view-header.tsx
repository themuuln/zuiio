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
import { Button } from "@/components/ui/button";
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
import { Typography } from "@/components/ui/typography";

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
          <Typography.H1 className="text-base font-semibold tracking-tight">{t("title")}</Typography.H1>
          {userIsMechanic && (
            <Button
              variant={myJobsOnly ? "default" : "outline"}
              size="sm"
              onClick={onMyJobsToggle}
              className="gap-1 px-1.5 py-0.5 text-[10px] font-medium h-auto"
            >
              {myJobsOnly ? (
                <UserCheck className="size-2.5" />
              ) : (
                <UserPlus className="size-2.5" />
              )}
              {myJobsOnly ? t("myJobs") : t("allJobs")}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onShowVehicleReg}
                    className="size-5"
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
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onShowMechanicReg}
                    className="size-5"
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
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onShowServiceLookup}
                    className="size-5"
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
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onShowShiftReport}
                    className="size-5"
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
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onShowPinSettings}
                    className="size-5"
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
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmSeed}
              disabled={seeding}
              className="px-1.5 py-0.5 text-[9px] font-semibold h-auto"
            >
              {seeding ? t("adding") : t("confirm")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelSeed}
              className="px-1.5 py-0.5 text-[9px] font-medium h-auto"
            >
              {t("cancel")}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={onSeedQueue}
            disabled={seeding}
            className="gap-1 px-1.5 py-0.5 text-[9px] h-auto"
          >
            <CarFront className="size-3" />
            <span className="hidden sm:inline">
              {seeding ? t("adding") : t("seedQueue")}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
