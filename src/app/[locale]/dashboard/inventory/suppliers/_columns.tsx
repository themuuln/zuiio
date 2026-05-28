"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground/60" />
          <button
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cb.onEdit(row.original.id)}
          >
            Edit
          </Button>
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
