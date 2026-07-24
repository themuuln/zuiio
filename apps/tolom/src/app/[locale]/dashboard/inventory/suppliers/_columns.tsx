"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { Supplier } from "@/lib/types";

interface ColumnCallbacks {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function createColumns(cb: ColumnCallbacks): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => {
        const t = useTranslations("inventory") as (
          key: string,
          values?: Record<string, string | number>,
        ) => string;
        return <DataTableColumnHeader column={column} title={t("name")} />;
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground/60" />
          <button
            type="button"
            className="font-medium hover:underline text-left"
            onClick={(e) => {
              e.stopPropagation();
              cb.onEdit(row.original.id);
            }}
          >
            {row.original.name}
          </button>
        </div>
      ),
    },
    {
      accessorKey: "contact_person",
      header: ({ column }) => {
        const t = useTranslations("inventory") as (
          key: string,
          values?: Record<string, string | number>,
        ) => string;
        return (
          <DataTableColumnHeader column={column} title={t("contactPerson")} />
        );
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.contact_person ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => {
        const t = useTranslations("inventory") as (
          key: string,
          values?: Record<string, string | number>,
        ) => string;
        return <DataTableColumnHeader column={column} title={t("phone")} />;
      },
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        const t = useTranslations("inventory") as (
          key: string,
          values?: Record<string, string | number>,
        ) => string;
        return <DataTableColumnHeader column={column} title={t("email")} />;
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.email ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="flex items-center justify-center gap-1"
          onClick={(e) => e.stopPropagation()}
          role="none"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cb.onEdit(row.original.id)}
          >
            {useTranslations("common")("edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => cb.onDelete(row.original.id)}
          >
            {useTranslations("common")("delete")}
          </Button>
        </span>
      ),
    },
  ];
}
