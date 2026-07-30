"use client";

import {
  Check,
  CheckCircle,
  Package,
  Play,
  StickyNote,
  Trash2,
  UserPlus,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
  const { onStatusChange, onRemoveFromBay, onOpenDetail } = useBayCardContext();
  // Status transition buttons — config driven
  const statusActions: {
    status: string;
    targetStatus: string;
    icon: React.ReactNode;
    label: string;
  }[] = [
    {
      status: "New",
      targetStatus: "Diagnosing",
      icon: <Play className="size-3.5" />,
      label: "Start",
    },
    {
      status: "Diagnosing",
      targetStatus: "In Progress",
      icon: <Wrench className="size-3.5" />,
      label: "Repair",
    },
    {
      status: "In Progress",
      targetStatus: "Ready for Pickup",
      icon: <Check className="size-3.5" />,
      label: "Ready",
    },
    {
      status: "Ready for Pickup",
      targetStatus: "Completed",
      icon: <CheckCircle className="size-3.5" />,
      label: "Complete",
    },
  ];

  return (
    <div
      data-slot="bay-view-footer-buttons"
      className="flex items-center gap-1.5"
    >
      {statusActions.map((action) =>
        workOrder.status === action.status ? (
          <Button
            key={action.status}
            size="sm"
            className="h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(workOrder.id, action.targetStatus);
            }}
            disabled={isPending}
          >
            {action.icon} {action.label}
          </Button>
        ) : null,
      )}
      <div className="ml-auto flex items-center gap-0.5">
        {/* Add Service — opens drawer with service panel */}
        <Button
          size="icon"
          variant="ghost"
          disabled={isPending}
          className="rounded-md text-blue-600/70 bg-blue-500/5 hover:bg-blue-500/15 dark:text-blue-400/80 dark:bg-blue-950/10 dark:hover:bg-blue-950/25"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(workOrder.id, "add-service");
          }}
          title={t("addService")}
          aria-label={t("addService")}
        >
          <Wrench className="size-3.5" />
        </Button>
        {/* Add Part — opens drawer with part panel */}
        <Button
          size="icon"
          variant="ghost"
          disabled={isPending}
          className="rounded-md text-amber-600/70 bg-amber-500/5 hover:bg-amber-500/15 dark:text-amber-400/80 dark:bg-amber-950/10 dark:hover:bg-amber-950/25"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(workOrder.id, "add-part");
          }}
          title={t("addPart")}
          aria-label={t("addPart")}
        >
          <Package className="size-3.5" />
        </Button>
        {/* Add Note — opens drawer */}
        <Button
          size="icon"
          variant="ghost"
          disabled={isPending}
          className="rounded-md text-emerald-600/70 bg-emerald-500/5 hover:bg-emerald-500/15 dark:text-emerald-400/80 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/25"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(workOrder.id);
          }}
          title={t("addNote")}
          aria-label={t("addNote")}
        >
          <StickyNote className="size-3.5" />
        </Button>
        {/* Assign Mechanic — opens detail drawer */}
        <Button
          size="icon"
          variant="ghost"
          disabled={isPending}
          className="rounded-md text-violet-600/70 bg-violet-500/5 hover:bg-violet-500/15 dark:text-violet-400/80 dark:bg-violet-950/10 dark:hover:bg-violet-950/25"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(workOrder.id);
          }}
          title={t("selectMechanic")}
          aria-label={t("selectMechanic")}
        >
          <UserPlus className="size-3.5" />
        </Button>
        {workOrder.status !== "Completed" &&
          workOrder.status !== "Cancelled" &&
          onRemoveFromBay && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromBay(workOrder.id);
              }}
              title={t("removeFromBay")}
              aria-label={t("removeFromBay")}
              disabled={isPending}
              className="rounded-md text-destructive/70 bg-destructive/5 hover:bg-destructive/15 hover:text-destructive dark:bg-red-950/10 dark:hover:bg-red-950/25"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
      </div>
    </div>
  );
}
