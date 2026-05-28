"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { InventoryBalanceWithAvgCost } from "@/lib/types";
import { Typography } from "@/components/ui/typography";

export interface ValuationRow extends InventoryBalanceWithAvgCost {
  avgUnitCost: number;
  totalValue: number;
}

export const columns: ColumnDef<ValuationRow>[] = [
  {
    id: "part_name",
    accessorKey: "part_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Part Name" />
    ),
    cell: ({ row }) => (
      <div>
        <Typography.Text className="font-medium">{row.original.part_name}</Typography.Text>
        <Typography.Muted className="text-xs text-muted-foreground">
          {row.original.part_number ?? "—"}
        </Typography.Muted>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.category ?? "—"}
      </span>
    ),
  },
  {
    id: "on_hand",
    accessorKey: "quantity_on_hand",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="On Hand" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.quantity_on_hand} {row.original.unit}
      </span>
    ),
  },
  {
    id: "avg_cost",
    accessorKey: "avgUnitCost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Avg Unit Cost" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.avgUnitCost.toLocaleString("mn-MN")} ₮
      </span>
    ),
  },
  {
    id: "total_value",
    accessorKey: "totalValue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Value" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums">
        {row.original.totalValue.toLocaleString("mn-MN")} ₮
      </span>
    ),
  },
];
