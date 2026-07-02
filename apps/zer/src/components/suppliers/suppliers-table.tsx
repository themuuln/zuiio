"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import {
  type SupplierDetailData,
  SupplierDetailDrawer,
} from "@/components/suppliers/supplier-detail-drawer";
import {
  type SupplierEditData,
  SupplierEditDrawer,
} from "@/components/suppliers/supplier-edit-drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { DataTable } from "@/components/ui/data-table";
import { TableActionsCell } from "@/components/ui/table-actions-cell";
import { formatCurrency } from "@/lib/format";

export type SupplierRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number | null;
};

function toDetailData(supplier: SupplierRow): SupplierDetailData {
  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    balance: supplier.balance,
  };
}

function toEditData(supplier: SupplierRow): SupplierEditData {
  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
  };
}

function buildColumns(
  onEdit: (supplier: SupplierRow) => void,
): ColumnDef<SupplierRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback>
                {supplier.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{supplier.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Утас",
      cell: ({ row }) => row.getValue("phone") ?? "-",
    },
    {
      accessorKey: "email",
      header: "Имэйл",
      cell: ({ row }) => row.getValue("email") ?? "-",
    },
    {
      accessorKey: "balance",
      header: "Өглөг",
      cell: ({ row }) => formatCurrency(Number(row.getValue("balance") ?? 0)),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const supplier = row.original;
        return <TableActionsCell onEdit={() => onEdit(supplier)} />;
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function SuppliersTable({ data }: { data: SupplierRow[] }) {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(
    null,
  );
  const [editSupplier, setEditSupplier] = useState<SupplierRow | null>(null);

  return (
    <>
      <DataTable
        columns={buildColumns(setEditSupplier)}
        data={data}
        searchColumn="name"
        searchPlaceholder="Нийлүүлэгчээр хайх..."
        pageSize={10}
        totalLabel="нийлүүлэгч"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelectedSupplier(row)}
      />
      {selectedSupplier && (
        <SupplierDetailDrawer
          supplier={toDetailData(selectedSupplier)}
          open={!!selectedSupplier}
          onOpenChange={(open) => {
            if (!open) setSelectedSupplier(null);
          }}
          onEdit={() => setEditSupplier(selectedSupplier)}
        />
      )}
      {editSupplier && (
        <SupplierEditDrawer
          supplier={toEditData(editSupplier)}
          open={!!editSupplier}
          onOpenChange={(open) => {
            if (!open) setEditSupplier(null);
          }}
        />
      )}
    </>
  );
}
