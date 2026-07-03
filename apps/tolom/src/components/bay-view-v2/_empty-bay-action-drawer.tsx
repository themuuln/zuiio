"use client";

import { Car, Clock, Loader2, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DrawerClose } from "@/components/ui/drawer";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Separator } from "@/components/ui/separator";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { cn, formatPlateNumber } from "@/lib/utils";

interface EmptyBayActionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bayNumber: number;
  queue: (WorkOrder & { vehicle: Vehicle | null })[];
  onSelectRegister: () => void;
  onSelectQueueItem: (workOrderId: string) => void;
  onSelectRegisterAndAssign: () => void;
}

// ── Utility: time since creation ──────────────────────────────
function timeSince(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "<1m";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function EmptyBayActionDrawer({
  open,
  onOpenChange,
  bayNumber,
  queue,
  onSelectRegister,
  onSelectQueueItem,
  onSelectRegisterAndAssign,
}: EmptyBayActionDrawerProps) {
  const t = useTranslations("bayView");
  const [selectedQueueItem, setSelectedQueueItem] = useState<string | null>(
    null,
  );

  const handleRegisterAndAssign = () => {
    onOpenChange(false);
    onSelectRegisterAndAssign();
  };

  const handleRegister = () => {
    onOpenChange(false);
    onSelectRegister();
  };

  const handleQueueSelect = (woId: string) => {
    setSelectedQueueItem(woId);
    onOpenChange(false);
    onSelectQueueItem(woId);
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      variant="quick"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <DetailDrawer.Header bordered={false} className="p-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs font-mono">
            Bay #{bayNumber}
          </Badge>
          <DrawerClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground/60 hover:text-foreground -mr-1"
              />
            }
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DrawerClose>
        </div>
        <DetailDrawer.Title className="text-lg">
          {t("addVehicleTitle")}
        </DetailDrawer.Title>
        <DetailDrawer.Description className="text-sm mt-1">
          {t("addVehicleSubtitle", { bayNumber })}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      {/* ── Action cards ────────────────────────────────────── */}
      <div className="px-6 pb-4 flex flex-col gap-2.5">
        {/* ── Primary: Register & Assign ─────────────────────── */}
        <button
          type="button"
          onClick={handleRegisterAndAssign}
          className={cn(
            "group relative flex items-center gap-3.5 rounded-xl border-2 p-3.5 text-left",
            "border-primary/40 bg-gradient-to-br from-primary/8 to-primary/3",
            "transition-all duration-200",
            "hover:border-primary/70 hover:shadow-md hover:shadow-primary/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          )}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:shadow-primary/30">
            <Zap className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span className="flex-1 min-w-0">
                {t("registerAndAssignToBay", { bayNumber })}
              </span>
              <span className="text-[10px] font-normal text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                {t("selectLabel")}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("registerAndAssignDesc")}
            </div>
          </div>
        </button>

        {/* ── Secondary: Register & Queue ────────────────────── */}
        <button
          type="button"
          onClick={handleRegister}
          className="group flex items-center gap-3.5 rounded-lg border border-border/50 bg-muted/20 p-3 text-left transition-all duration-200 hover:border-border hover:bg-muted/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
            <Car className="size-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span className="flex-1 min-w-0">{t("registerNewVehicle")}</span>
              <span className="text-[10px] font-normal text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                {t("selectLabel")}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t("registerNewVehicleDesc")}
            </div>
          </div>
        </button>
      </div>

      {/* ── Queue section ────────────────────────────────────── */}
      {queue.length > 0 && (
        <>
          <Separator />
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="size-3.5" />
                {t("pickFromQueue")}
              </div>
              <Badge
                variant="secondary"
                className="text-[10px] font-mono h-4 px-1.5"
              >
                {queue.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto -mx-2">
              {queue.slice(0, 10).map((wo) => {
                const isBusy = selectedQueueItem === wo.id;
                const waitText = wo.created_at ? timeSince(wo.created_at) : "";
                const isUrgent =
                  wo.created_at &&
                  (Date.now() - new Date(wo.created_at).getTime()) /
                    (1000 * 60 * 60) >=
                    2;
                return (
                  <button
                    key={wo.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleQueueSelect(wo.id)}
                    className={cn(
                      "group/row flex items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                      "transition-all duration-150",
                      isBusy
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-accent/60 active:bg-accent cursor-pointer",
                      isUrgent && !isBusy && "border-l-2 border-l-amber-400/40",
                    )}
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <div className="size-[18px] shrink-0 rounded-full border-2 border-muted-foreground/25 flex items-center justify-center transition-all duration-150 group-hover/row:border-primary/60 group-hover/row:bg-primary/5">
                        <div className="size-2 rounded-full opacity-0 transition-all duration-150 group-hover/row:opacity-100 group-hover/row:bg-primary/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {formatPlateNumber(wo.vehicle?.plate_number ?? "")}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                        {wo.vehicle?.make} {wo.vehicle?.model}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] shrink-0 tabular-nums",
                        isUrgent
                          ? "text-amber-600 font-medium"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {waitText}
                    </span>
                  </button>
                );
              })}
              {queue.length > 10 && (
                <div className="text-center text-[10px] text-muted-foreground/60 py-2">
                  {t("moreInQueue", { count: queue.length - 10 })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DetailDrawer>
  );
}
