"use client";

import { Eye, NotePencil } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
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

const defaultColumns: ColumnDef<SupplierRow>[] = [
  {
    accessorKey: "name",
    header: "Нэр",
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <SupplierDetailDrawer supplier={toDetailData(supplier)}>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="size-7">
              <AvatarFallback>
                {supplier.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{supplier.name}</span>
          </div>
        </SupplierDetailDrawer>
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
      return (
        <div className="flex items-center gap-1">
          <SupplierDetailDrawer supplier={toDetailData(supplier)} />
          <SupplierEditDrawer supplier={toEditData(supplier)} />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

export function SuppliersTable({ data }: { data: SupplierRow[] }) {
  return (
    <DataTable
      columns={defaultColumns}
      data={data}
      searchColumn="name"
      searchPlaceholder="Нийлүүлэгчээр хайх..."
      pageSize={10}
      totalLabel="нийлүүлэгч"
      enableSorting
      enableColumnVisibility
    />
  );
}
