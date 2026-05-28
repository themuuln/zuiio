"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Car, Hash, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { Vehicle } from "@/lib/types";
import { Typography } from "@/components/ui/typography";

export type VehicleRow = Vehicle & { owner_name?: string };

interface ColumnCallbacks {
  onEdit: (vehicle: VehicleRow) => void;
  onDelete: (vehicle: VehicleRow) => void;
}

export function createColumns(cb: ColumnCallbacks): ColumnDef<VehicleRow>[] {
  return [
    {
      id: "plate_number",
      accessorKey: "plate_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Plate" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
            <Car className="size-4 text-muted-foreground/70" />
          </div>
          <div className="min-w-0">
            <Typography.Text className="truncate font-mono text-sm font-semibold tracking-wide">
              {row.original.plate_number}
            </Typography.Text>
            <Typography.Muted className="text-xs text-muted-foreground">
              {[row.original.year, row.original.make, row.original.model]
                .filter(Boolean)
                .join(" ")}
            </Typography.Muted>
          </div>
        </div>
      ),
    },
    {
      id: "vin",
      accessorKey: "vin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="VIN" />
      ),
      cell: ({ row }) =>
        row.original.vin ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Hash className="size-3.5 shrink-0 text-muted-foreground/50" />
            <span className="truncate font-mono text-xs">
              {row.original.vin}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/50">&mdash;</span>
        ),
    },
    {
      id: "owner_name",
      accessorKey: "owner_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Owner" />
      ),
      cell: ({ row }) =>
        row.original.owner_name ? (
          <Typography.Text className="truncate text-sm">
            {row.original.owner_name}
          </Typography.Text>
        ) : (
          <span className="text-sm text-muted-foreground/50">&mdash;</span>
        ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              render={
                <button
                  type="button"
                  aria-label="Edit"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    cb.onEdit(vehicle);
                  }}
                />
              }
              nativeButton
              variant="ghost"
              size="icon-sm"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              render={
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    cb.onDelete(vehicle);
                  }}
                />
              }
              nativeButton
              variant="ghost"
              size="icon-sm"
              className="text-destructive/70 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
