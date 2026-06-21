"use client";

import type { ColumnDef } from "@tanstack/react-table";
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

function buildColumns(showBalance: boolean): ColumnDef<CustomerRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <CustomerDetailDrawer customer={toDetailData(customer)}>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar className="size-7">
                <AvatarFallback>
                  {customer.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{customer.name}</span>
            </div>
          </CustomerDetailDrawer>
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
        return (
          <div className="flex items-center gap-1">
            <CustomerDetailDrawer customer={toDetailData(customer)} />
            <CustomerEditDrawer customer={toEditData(customer)} />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function CustomersTable({
  data,
  showBalance = true,
}: {
  data: CustomerRow[];
  showBalance?: boolean;
}) {
  return (
    <DataTable
      columns={buildColumns(showBalance)}
      data={data}
      searchColumn="name"
      searchPlaceholder="Харилцагчаар хайх..."
      pageSize={10}
      totalLabel="харилцагч"
      enableSorting
      enableColumnVisibility
    />
  );
}
