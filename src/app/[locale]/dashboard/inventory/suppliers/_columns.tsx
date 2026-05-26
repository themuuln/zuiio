"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { Supplier } from "@/lib/types";

interface ColumnCallbacks {
  onDelete: (id: string) => void;
}

export function createColumns(cb: ColumnCallbacks): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground/60" />
          <a
            href={`/dashboard/inventory/suppliers/${row.original.id}`}
            className="font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.name}
          </a>
        </div>
      ),
    },
    {
      accessorKey: "contact_person",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact Person" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.contact_person ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
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
        <div
          className="flex items-center justify-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={`/dashboard/inventory/suppliers/${row.original.id}`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 px-3"
          >
            Edit
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => cb.onDelete(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
}
