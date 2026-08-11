"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { TableFeatures } from "@/components/ui/data-table-features";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Typography } from "@/components/ui/typography";
import type { EstimateListItem } from "@/lib/queries/use-estimates";
import type { EstimateStatus } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

const STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: "statusDraft",
  sent: "statusSent",
  approved: "statusApproved",
  declined: "statusDeclined",
  expired: "statusExpired",
  converted: "statusConverted",
};

const STATUS_OPTIONS: EstimateStatus[] = [
  "draft",
  "sent",
  "approved",
  "declined",
  "expired",
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  declined: "bg-red-500",
  expired: "bg-yellow-500",
  converted: "bg-purple-500",
};

function getCustomerName(e: EstimateListItem): string {
  return (
    [e.customer?.first_name, e.customer?.last_name].filter(Boolean).join(" ") ||
    "—"
  );
}

function getVehicleDisplay(e: EstimateListItem): string {
  if (!e.vehicle) return "—";
  return [e.vehicle.make, e.vehicle.model, e.vehicle.plate_number]
    .filter(Boolean)
    .join(" ");
}

interface ColumnCallbacks {
  onStatusChange: (estimateId: string, newStatus: EstimateStatus) => void;
  onCancel: (estimateId: string) => void;
  updatePending: boolean;
}

export function createColumns(
  cb: ColumnCallbacks,
): ColumnDef<TableFeatures, EstimateListItem>[] {
  return [
    {
      accessorKey: "estimate_number",
      header: ({ column }) => {
        const t = useTranslations("estimates") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("number")} />;
      },
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          {row.original.estimate_number}
        </span>
      ),
    },
    {
      id: "customer",
      header: ({ column }) => {
        const t = useTranslations("estimates") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("customer")} />;
      },
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <Typography.Text className="font-medium truncate max-w-[200px]">
              {getCustomerName(e)}
            </Typography.Text>
            {e.vehicle?.plate_number && (
              <Typography.Muted className="text-xs text-muted-foreground truncate max-w-[200px]">
                {getVehicleDisplay(e)}
              </Typography.Muted>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "vehicle",
      header: ({ column }) => {
        const t = useTranslations("estimates") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("vehicle")} />;
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {getVehicleDisplay(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        const t = useTranslations("estimates") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("status")} />;
      },
      cell: ({ row }) => {
        const t = useTranslations("estimates") as (key: string) => string;
        const e = row.original;
        const isConverted = e.status === "converted";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Badge
                  variant="outline"
                  className={`gap-1.5 ${isConverted ? "cursor-default" : "cursor-pointer hover:opacity-80 transition-opacity"}`}
                />
              }
            >
              <span
                className={`size-2 rounded-full ${STATUS_COLORS[e.status] ?? "bg-gray-500"}`}
              />
              {t(STATUS_LABELS[e.status] ?? e.status)}
              {!isConverted && <ArrowUpDown className="size-3 opacity-60" />}
            </DropdownMenuTrigger>
            {!isConverted && (
              <DropdownMenuContent align="start" className="min-w-[160px]">
                <DropdownMenuGroup>
                  {STATUS_OPTIONS.map((s) =>
                    s !== e.status ? (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => cb.onStatusChange(e.id, s)}
                        disabled={cb.updatePending}
                      >
                        <span
                          className={`size-2 rounded-full ${STATUS_COLORS[s]}`}
                        />
                        {t(STATUS_LABELS[s])}
                      </DropdownMenuItem>
                    ) : null,
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => cb.onCancel(e.id)}
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        );
      },
    },
    {
      id: "items_count",
      accessorFn: (row) => row.items?.length ?? 0,
      header: ({ column }) => {
        const t = useTranslations("estimates") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("items")} />;
      },
      cell: ({ row }) => {
        const count = row.original.items?.length ?? 0;
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {count}
          </span>
        );
      },
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: ({ column }) => {
        const t = useTranslations("estimates") as (key: string) => string;
        return <DataTableColumnHeader column={column} title={t("date")} />;
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "grand_total",
      accessorKey: "grand_total",
      meta: { align: "right" } as const,
      header: ({ column }) => {
        const t = useTranslations("estimates") as (key: string) => string;
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
      id: "actions",
      cell: ({ row }) => {
        const e = row.original;
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
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = `/dashboard/estimates/${e.id}`;
                  }}
                >
                  View details
                </DropdownMenuItem>
                {e.status !== "converted" && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => cb.onCancel(e.id)}
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Delete
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
