"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Typography } from "@/components/ui/typography";
import type { InventoryBalanceWithAvgCost } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

export interface ValuationRow extends InventoryBalanceWithAvgCost {
  avgUnitCost: number;
  totalValue: number;
}

export const columns: ColumnDef<ValuationRow>[] = [
  {
    id: "part_name",
    accessorKey: "part_name",
    header: ({ column }) => {
      const t = useTranslations("inventory") as (
        key: string,
        values?: Record<string, string | number>,
      ) => string;
      return <DataTableColumnHeader column={column} title={t("partName")} />;
    },
    cell: ({ row }) => (
      <div>
        <Typography.Text className="font-medium">
          {row.original.part_name}
        </Typography.Text>
        <Typography.Muted className="text-xs text-muted-foreground">
          {row.original.part_number ?? "—"}
        </Typography.Muted>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      const t = useTranslations("inventory") as (
        key: string,
        values?: Record<string, string | number>,
      ) => string;
      return <DataTableColumnHeader column={column} title={t("category")} />;
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.category ?? "—"}
      </span>
    ),
  },
  {
    id: "on_hand",
    accessorKey: "quantity_on_hand",
    meta: { align: "right" } as const,
    header: ({ column }) => {
      const t = useTranslations("inventory") as (
        key: string,
        values?: Record<string, string | number>,
      ) => string;
      return <DataTableColumnHeader column={column} title={t("onHand")} />;
    },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.quantity_on_hand} {row.original.unit}
      </span>
    ),
  },
  {
    id: "avg_cost",
    accessorKey: "avgUnitCost",
    meta: { align: "right" } as const,
    header: ({ column }) => {
      const t = useTranslations("inventory") as (
        key: string,
        values?: Record<string, string | number>,
      ) => string;
      return <DataTableColumnHeader column={column} title={t("avgUnitCost")} />;
    },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatMNT(row.original.avgUnitCost)}
      </span>
    ),
  },
  {
    id: "total_value",
    accessorKey: "totalValue",
    meta: { align: "right" } as const,
    header: ({ column }) => {
      const t = useTranslations("inventory") as (
        key: string,
        values?: Record<string, string | number>,
      ) => string;
      return <DataTableColumnHeader column={column} title={t("totalValue")} />;
    },
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums">
        {formatMNT(row.original.totalValue)}
      </span>
    ),
  },
];
