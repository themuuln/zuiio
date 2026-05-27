"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { WorkOrderListItem } from "@/lib/queries/use-work-orders";
import { formatMNT } from "@/lib/utils";

// ── Status helpers ────────────────────────────────────────────

const STATUS_NAMES: Record<string, string> = {
  New: "statusNew",
  Diagnosing: "statusDiagnosing",
  "In Progress": "statusInProgress",
  "Ready for Pickup": "statusReadyForPickup",
  Completed: "statusCompleted",
  Cancelled: "statusCancelled",
};

const STATUS_OPTIONS = Object.keys(STATUS_NAMES).filter(
  (s) => s !== "Cancelled",
);

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

function getDaysSince(dateStr: string): number {
  const created = new Date(dateStr);
  const now = new Date();
  return Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getAgeDisplay(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// ── Column factory ────────────────────────────────────────────

interface ColumnCallbacks {
  onStatusChange: (woId: string, newStatus: string) => void;
  onCancel: (woId: string) => void;
  updatePending: boolean;
}

export function createColumns(
  cb: ColumnCallbacks,
): ColumnDef<WorkOrderListItem>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="WO #" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          #{row.original.id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: "customer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => {
        const wo = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <p className="font-medium truncate max-w-[200px]">
              {getCustomerName(wo)}
            </p>
            {wo.vehicle?.plate_number && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {getVehicleDisplay(wo)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "vehicle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vehicle" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {getVehicleDisplay(row.original)}
        </span>
      ),
    },
    {
      id: "mechanic",
      accessorFn: (row) => row.mechanic?.full_name ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mechanic" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.mechanic?.full_name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const wo = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Badge
                  variant="outline"
                  className="gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {wo.status}
                  <ArrowUpDown className="size-3 opacity-60" />
                </Badge>
              }
            />
            <DropdownMenuContent align="start" className="min-w-[160px]">
              {STATUS_OPTIONS.flatMap((s) =>
                s !== wo.status
                  ? [
                      <DropdownMenuItem
                        key={s}
                        onClick={() => cb.onStatusChange(wo.id, s)}
                        disabled={cb.updatePending}
                      >
                        {s}
                      </DropdownMenuItem>,
                    ]
                  : [],
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => cb.onCancel(wo.id)}
              >
                <Trash2 className="size-3.5 mr-2" />
                Cancel Work Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      id: "age",
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Age" />
      ),
      cell: ({ row }) => {
        const days = getDaysSince(row.original.created_at);
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {getAgeDisplay(days)}
          </span>
        );
      },
    },
    {
      id: "grand_total",
      accessorKey: "grand_total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => {
        const total = row.original.grand_total;
        return (
          <span className="text-sm font-medium tabular-nums">
            {total !== undefined ? `₮${total.toLocaleString()}` : "—"}
          </span>
        );
      },
    },
    {
      id: "services_cost",
      accessorKey: "services_cost",
      header: "Services",
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
      header: "Parts Cost",
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Gross Profit" />
      ),
      cell: ({ row }) => {
        const val = row.original.gross_profit;
        if (val === undefined)
          return <span className="text-muted-foreground">—</span>;
        return (
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
      },
    },
    {
      id: "margin_percent",
      accessorKey: "margin_percent",
      header: "Margin",
      cell: ({ row }) => {
        const val = row.original.margin_percent;
        if (val === undefined)
          return <span className="text-muted-foreground">–</span>;
        return (
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
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const wo = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem
                onClick={() =>
                  (window.location.href = `/dashboard/work-orders/${wo.id}`)
                }
              >
                View Details
              </DropdownMenuItem>
              {wo.status !== "Cancelled" && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => cb.onCancel(wo.id)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Cancel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
