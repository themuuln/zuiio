"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { TableFeatures } from "@/components/ui/data-table-features";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { WorkOrderListItem } from "@/lib/queries/use-work-orders";
import { cn, formatMNT } from "@/lib/utils";

// ── Status helpers ────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────

function getCustomerName(wo: WorkOrderListItem): string {
  return (
    [wo.customer?.first_name, wo.customer?.last_name]
      .filter(Boolean)
      .join(" ") || "—"
  );
}

function getVehicleDisplay(wo: WorkOrderListItem): string {
  if (!wo.vehicle) return "—";
  return [wo.vehicle.make, wo.vehicle.model, wo.vehicle.plate_number]
    .filter(Boolean)
    .join(" ");
}

function getDaysSince(dateStr: string | null | undefined, now: Date): number {
  if (!dateStr) return 0;
  const created = new Date(dateStr);
  if (Number.isNaN(created.getTime())) return 0;
  return Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function getAgeDisplay(
  days: number,
  t?: (key: string, values?: Record<string, number>) => string,
): string {
  if (days === 0) return t ? t("today") : "Today";
  if (days === 1) return t ? t("yesterday") : "Yesterday";
  return t ? t("daysAgo", { days }) : `${days} days ago`;
}

// ── Column factory ────────────────────────────────────────────

interface ColumnCallbacks {
  onStatusChange: (woId: string, newStatus: string) => void;
  onCancel: (woId: string) => void;
  updatePending: boolean;
  onViewDetail?: (woId: string) => void;
  onChangeStatus?: (woId: string, currentStatus: string) => void;
}

export function createColumns(
  cb: ColumnCallbacks,
): ColumnDef<TableFeatures, WorkOrderListItem>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("id")} />;
      },
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          #{row.original.id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: "customer",
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("customer")} />;
      },
      cell: ({ row }) => {
        const wo = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <Typography.Text className="font-medium truncate max-w-[200px]">
              {getCustomerName(wo)}
            </Typography.Text>
            {wo.vehicle?.plate_number && (
              <Typography.Muted className="text-xs text-muted-foreground truncate max-w-[200px]">
                {getVehicleDisplay(wo)}
              </Typography.Muted>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "vehicle",
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("vehicle")} />;
      },
      cell: ({ row }) => {
        const v = row.original.vehicle;
        if (!v) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold tabular-nums">
              {v.plate_number || "—"}
            </span>
            {v.make || v.model ? (
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                {[v.make, v.model].filter(Boolean).join(" ")}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "mechanic",
      accessorFn: (row) => row.mechanic?.full_name ?? "",
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("mechanic")} />;
      },
      cell: ({ row }) => {
        const mechanic = row.original.mechanic;
        if (!mechanic)
          return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-2">
            <MechanicAvatar mechanic={mechanic} size="sm" />
            <span className="text-sm text-muted-foreground">
              {mechanic.full_name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("status")} />;
      },
      cell: ({ row }) => {
        const wo = row.original;
        const statusColors: Record<string, string> = {
          New: "bg-blue-500/15 text-blue-500 border-blue-500/30",
          Diagnosing: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
          "In Progress":
            "bg-orange-500/15 text-orange-500 border-orange-500/30",
          "Ready for Pickup":
            "bg-green-500/15 text-green-500 border-green-500/30",
          Completed: "bg-gray-500/15 text-gray-500 border-gray-500/30",
          Cancelled: "bg-red-500/15 text-red-500 border-red-500/30",
        };
        return (
          <button
            type="button"
            onClick={() => cb.onChangeStatus?.(wo.id, wo.status)}
            className={cn(
              "inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium whitespace-nowrap cursor-pointer select-none transition-opacity hover:opacity-80",
              statusColors[wo.status] ??
                "bg-gray-500/15 text-gray-500 border-gray-500/30",
            )}
          >
            {wo.status}
          </button>
        );
      },
    },
    {
      id: "age",
      accessorKey: "created_at",
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("age")} />;
      },
      cell: ({ row }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        const now = useClientNow();
        const days = getDaysSince(row.original.created_at, now);
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {getAgeDisplay(days, t)}
          </span>
        );
      },
    },
    {
      id: "grand_total",
      accessorKey: "grand_total",
      meta: { align: "right" as const },
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("total")} />;
      },
      cell: ({ row }) => {
        const total = row.original.grand_total;
        return (
          <span className="text-sm font-medium tabular-nums">
            {total !== undefined ? formatMNT(total) : "—"}
          </span>
        );
      },
    },
    {
      id: "services_cost",
      accessorKey: "services_cost",
      meta: { align: "right" as const },
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return (
          <DataTableColumnHeader column={column} title={t("servicesCost")} />
        );
      },
      cell: ({ row }) => {
        const val = row.original.services_cost;
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {val !== undefined ? formatMNT(val) : "—"}
          </span>
        );
      },
    },
    {
      id: "parts_cost",
      accessorKey: "parts_cost",
      meta: { align: "right" as const },
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("partsCost")} />;
      },
      cell: ({ row }) => {
        const val = row.original.parts_cost;
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {val !== undefined ? formatMNT(val) : "—"}
          </span>
        );
      },
    },
    {
      id: "gross_profit",
      accessorKey: "gross_profit",
      meta: { align: "right" as const },
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return (
          <DataTableColumnHeader column={column} title={t("grossProfit")} />
        );
      },
      cell: ({ row }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        const val = row.original.gross_profit;
        const lossReason = row.original.loss_reason;
        if (val === undefined)
          return <span className="text-muted-foreground">—</span>;
        const displayVal = (
          <span
            className={`text-sm font-medium tabular-nums ${
              val > 0
                ? "text-green-600 dark:text-green-400"
                : val < 0
                  ? "text-red-600 dark:text-red-400"
                  : ""
            }`}
          >
            {formatMNT(val)}
          </span>
        );

        if (val < 0 && lossReason) {
          return (
            <Tooltip>
              <TooltipTrigger>{displayVal}</TooltipTrigger>
              <TooltipContent className="max-w-[240px] text-xs">
                <span className="font-semibold text-destructive block mb-0.5">
                  {t("lossReason")}:
                </span>
                {lossReason}
              </TooltipContent>
            </Tooltip>
          );
        }

        return displayVal;
      },
    },
    {
      id: "margin_percent",
      accessorKey: "margin_percent",
      meta: { align: "right" as const },
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("margin")} />;
      },
      cell: ({ row }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        const val = row.original.margin_percent;
        const lossReason = row.original.loss_reason;
        if (val === undefined)
          return <span className="text-muted-foreground">–</span>;
        const displayVal = (
          <span
            className={`text-sm tabular-nums ${
              val > 0
                ? "text-green-600 dark:text-green-400"
                : val < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
            }`}
          >
            {val.toFixed(1)}%
          </span>
        );

        if (val < 0 && lossReason) {
          return (
            <Tooltip>
              <TooltipTrigger>{displayVal}</TooltipTrigger>
              <TooltipContent className="max-w-[240px] text-xs">
                <span className="font-semibold text-destructive block mb-0.5">
                  {t("lossReason")}:
                </span>
                {lossReason}
              </TooltipContent>
            </Tooltip>
          );
        }

        return displayVal;
      },
    },
    {
      id: "loss_reason",
      accessorKey: "loss_reason",
      enableHiding: true,
      header: ({ column }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        return (
          <DataTableColumnHeader column={column} title={t("lossReason")} />
        );
      },
      cell: ({ row }) => {
        const val = row.original.loss_reason;
        return (
          <span
            className="text-xs text-muted-foreground truncate max-w-[150px] block"
            title={val ?? undefined}
          >
            {val || "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const t = useTranslations("workOrders") as (key: string) => string;
        const wo = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => cb.onViewDetail?.(wo.id)}>
                  {t("viewDetails")}
                </DropdownMenuItem>
                {wo.status !== "Cancelled" && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => cb.onCancel(wo.id)}
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    {t("cancelWorkOrder")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
