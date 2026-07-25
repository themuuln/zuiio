"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import {
  type CustomerDetailData,
  CustomerDetailDrawer,
} from "@/components/customers/customer-detail-drawer";
import {
  type CustomerEditData,
  CustomerEditDrawer,
} from "@/components/customers/customer-edit-drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { DataTable } from "@/components/ui/data-table";
import { TableActionsCell } from "@/components/ui/table-actions-cell";
import { formatCurrency } from "@/lib/format";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number | null;
};

function toDetailData(customer: CustomerRow): CustomerDetailData {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    balance: customer.balance,
  };
}

function toEditData(customer: CustomerRow): CustomerEditData {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
  };
}

function buildColumns(
  showBalance: boolean,
  onEdit: (customer: CustomerRow) => void,
): ColumnDef<CustomerRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback>
                {customer.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{customer.name}</span>
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
    ...(showBalance
      ? [
          {
            accessorKey: "balance" as const,
            header: "Авлага",
            cell: ({ row }: { row: { getValue: (key: string) => unknown } }) =>
              formatCurrency(Number(row.getValue("balance") ?? 0)),
          },
        ]
      : []),
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const customer = row.original;
        return <TableActionsCell onEdit={() => onEdit(customer)} />;
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function CustomersTable({
  data,
  showBalance = true,
  loading,
  toolbar,
}: {
  data: CustomerRow[];
  showBalance?: boolean;
  loading?: boolean;
  toolbar?: React.ReactNode;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(
    null,
  );
  const [editCustomer, setEditCustomer] = useState<CustomerRow | null>(null);

  return (
    <>
      <DataTable
        columns={buildColumns(showBalance, setEditCustomer)}
        data={data}
        searchColumn="name"
        loading={loading}
        toolbar={toolbar}
        searchPlaceholder="Харилцагчаар хайх..."
        pageSize={10}
        totalLabel="харилцагч"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelectedCustomer(row)}
      />
      <CustomerDetailDrawer
        customer={
          selectedCustomer
            ? toDetailData(selectedCustomer)
            : ({} as CustomerDetailData)
        }
        open={!!selectedCustomer}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomer(null);
        }}
        onEdit={() => selectedCustomer && setEditCustomer(selectedCustomer)}
      />
      <CustomerEditDrawer
        customer={
          editCustomer ? toEditData(editCustomer) : ({} as CustomerEditData)
        }
        open={!!editCustomer}
        onOpenChange={(open) => {
          if (!open) setEditCustomer(null);
        }}
      />
    </>
  );
}
