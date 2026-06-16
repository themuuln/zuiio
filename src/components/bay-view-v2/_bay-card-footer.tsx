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
import type {
  BayCardActionHandlers,
  BayCardWorkOrder,
} from "./_bay-card-types";

interface BayCardFooterProps
  extends Pick<
    BayCardActionHandlers,
    | "onStatusChange"
    | "onRemoveFromBay"
    | "onOpenDetail"
    | "onPauseTimer"
    | "onAddNote"
    | "onQuickAddService"
    | "onQuickAddParts"
  > {
  workOrder: BayCardWorkOrder;
  isPending?: boolean;
}

export function BayCardFooter({
  workOrder,
  isPending = false,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  onPauseTimer,
  onAddNote,
  onQuickAddService,
  onQuickAddParts,
}: BayCardFooterProps) {
  const t = useTranslations("bayView");

  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      {workOrder.status === "New" && (
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
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
          className="h-8 gap-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
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
          className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
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
          className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
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
            onClick={(e) => e.stopPropagation()}
            render={
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={isPending}
                className="size-8 rounded-lg text-muted-foreground/60 hover:text-foreground"
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
