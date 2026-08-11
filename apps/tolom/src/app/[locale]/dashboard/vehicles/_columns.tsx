"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Car, Hash, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { TableFeatures } from "@/components/ui/data-table-features";
import { Typography } from "@/components/ui/typography";
import type { Vehicle } from "@/lib/types";

export type VehicleRow = Vehicle & { owner_name?: string };

interface ColumnCallbacks {
  onEdit: (vehicle: VehicleRow) => void;
  onDelete: (vehicle: VehicleRow) => void;
}

export function createColumns(
  cb: ColumnCallbacks,
): ColumnDef<TableFeatures, VehicleRow>[] {
  return [
    {
      id: "plate_number",
      accessorKey: "plate_number",
      header: ({ column }) => {
        const t = useTranslations("vehicles") as (
          key: string,
          values?: Record<string, string | number>,
        ) => string;
        return <DataTableColumnHeader column={column} title={t("plate")} />;
      },
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
      header: ({ column }) => {
        const t = useTranslations("vehicles") as (
          key: string,
          values?: Record<string, string | number>,
        ) => string;
        return <DataTableColumnHeader column={column} title={t("vin")} />;
      },
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
      header: ({ column }) => {
        const t = useTranslations("vehicles") as (
          key: string,
          values?: Record<string, string | number>,
        ) => string;
        return <DataTableColumnHeader column={column} title={t("owner")} />;
      },
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
                  aria-label={useTranslations("common")("edit")}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    cb.onEdit(vehicle);
                  }}
                />
              }
              nativeButton
              variant="ghost"
              size="icon"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              render={
                <button
                  type="button"
                  aria-label={useTranslations("common")("delete")}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    cb.onDelete(vehicle);
                  }}
                />
              }
              nativeButton
              variant="ghost"
              size="icon"
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
