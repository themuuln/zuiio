"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";

export type SaleRow = {
  id: string;
  sale_date: string;
  contact_name: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  status: string | null;
  payment_method: string | null;
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

function statusBadgeVariant(
  status: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "completed":
      return "Дууссан";
    case "pending":
      return "Хүлээгдэж буй";
    case "cancelled":
      return "Цуцлагдсан";
    default:
      return status ?? "-";
  }
}

const columns: ColumnDef<SaleRow>[] = [
  {
    accessorKey: "sale_date",
    header: "Огноо",
    cell: ({ row }) => formatDate(row.getValue("sale_date")),
  },
  {
    accessorKey: "contact_name",
    header: "Харилцагч",
    filterFn: (row, _columnId, filterValue: string) => {
      const name = String(row.getValue("contact_name") ?? "").toLowerCase();
      const date = String(row.getValue("sale_date") ?? "").toLowerCase();
      const amount = String(row.getValue("total_amount") ?? "").toLowerCase();
      const search = filterValue.toLowerCase();
      return (
        name.includes(search) ||
        date.includes(search) ||
        amount.includes(search)
      );
    },
    cell: ({ row }) => row.getValue("contact_name") ?? "-",
  },
  {
    accessorKey: "total_amount",
    header: "Нийт дүн",
    cell: ({ row }) =>
      formatCurrency(Number(row.getValue("total_amount") ?? 0)),
  },
  {
    accessorKey: "paid_amount",
    header: "Төлсөн дүн",
    cell: ({ row }) => formatCurrency(Number(row.getValue("paid_amount") ?? 0)),
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.getValue("status") as string | null;
      return (
        <Badge variant={statusBadgeVariant(status)}>
          {statusLabel(status)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "payment_method",
    header: "Төлбөрийн арга",
    cell: ({ row }) => {
      const method = row.getValue("payment_method") as string | null;
      return paymentMethodLabels[method ?? ""] ?? method ?? "-";
    },
  },
];

export function SalesTable({ data }: { data: SaleRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumn="contact_name"
      searchPlaceholder="Огноо, харилцагч, дүнгээр хайх..."
      pageSize={10}
      totalLabel="борлуулалт"
    />
  );
}
