"use client";

import {
  Check,
  CheckCircle,
  FileText,
  MoreHorizontal,
  Play,
  Plus,
  Timer,
  Trash2,
  UserPlus,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_BTN_SOLID } from "./_constants";
import { cn } from "@/lib/utils";


import { useBayCardContext } from "./_bay-card-context";
import type { BayCardWorkOrder } from "./_bay-card-types";

interface BayCardFooterProps {
  workOrder: BayCardWorkOrder;
  isPending?: boolean;
}

export function BayCardFooter({
  workOrder,
  isPending = false,
}: BayCardFooterProps) {
  const t = useTranslations("bayView");
  const {
    onStatusChange,
    onRemoveFromBay,
    onOpenDetail,
    onPauseTimer,
    onAddNote,
    onQuickAddService,
    onQuickAddParts,
  } = useBayCardContext();

  // Map current status → target status for button color derivation
  const statusButtonTarget: Record<string, string> = {
    New: "Diagnosing",
    Diagnosing: "In Progress",
    "In Progress": "Ready for Pickup",
    "Ready for Pickup": "Completed",
  };
  const targetStatus = statusButtonTarget[workOrder.status];
  const btnBg = targetStatus ? STATUS_BTN_SOLID[targetStatus] : "";

  return (
    <div
      data-slot="bay-view-footer-buttons"
      className="flex items-center gap-2 px-3 py-2.5"
    >
      {workOrder.status === "New" && (
        <Button
          size="sm"
          className={cn("h-8 gap-1.5 rounded-lg text-xs font-bold text-white hover:opacity-85", btnBg)}
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(workOrder.id, "Diagnosing");
          }}
          disabled={isPending}
        >
          <Play className="size-3.5" /> Start
        </Button>
      )}
      {workOrder.status === "Diagnosing" && (
        <Button
          size="sm"
          className={cn("h-8 gap-1.5 rounded-lg text-xs font-bold text-white hover:opacity-85", btnBg)}
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(workOrder.id, "In Progress");
          }}
          disabled={isPending}
        >
          <Wrench className="size-3.5" /> Repair
        </Button>
      )}
      {workOrder.status === "In Progress" && (
        <Button
          size="sm"
          className={cn("h-8 gap-1.5 rounded-lg text-xs font-bold text-white hover:opacity-85", btnBg)}
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(workOrder.id, "Ready for Pickup");
          }}
          disabled={isPending}
        >
          <Check className="size-3.5" /> Ready
        </Button>
      )}
      {workOrder.status === "Ready for Pickup" && (
        <Button
          size="sm"
          className={cn("h-8 gap-1.5 rounded-lg text-xs font-bold text-white hover:opacity-85", btnBg)}
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(workOrder.id, "Completed");
          }}
          disabled={isPending}
        >
          <CheckCircle className="size-3.5" /> Complete
        </Button>
      )}
      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            nativeButton={false}
            onClick={(e) => e.stopPropagation()}
            render={
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={isPending}
                className="size-8 rounded-lg text-muted-foreground/60 hover:text-foreground"
                aria-label={t("moreActions")}
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onPauseTimer?.(workOrder.id);
              }}
              className="gap-2 text-xs"
            >
              <Timer className="size-3.5" /> Pause Timer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onAddNote?.(workOrder.id);
              }}
              className="gap-2 text-xs"
            >
              <FileText className="size-3.5" /> Add Note
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onQuickAddService?.(workOrder.id);
              }}
              className="gap-2 text-xs"
            >
              <Wrench className="size-3.5" /> Add Service
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onQuickAddParts?.(workOrder.id);
              }}
              className="gap-2 text-xs"
            >
              <Plus className="size-3.5" /> {t("addPart")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(workOrder.id);
              }}
              className="gap-2 text-xs"
            >
              <UserPlus className="size-3.5" /> Assign Mechanic
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {workOrder.status !== "Completed" &&
          workOrder.status !== "Cancelled" &&
          onRemoveFromBay && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromBay(workOrder.id);
              }}
              title={t("removeFromBay")}
              aria-label={t("removeFromBay")}
              disabled={isPending}
              className="size-8 rounded-lg text-muted-foreground/60 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
      </div>
    </div>
  );
}
