"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { currencyColumn, dateColumn, textColumn } from "@/lib/table-columns";

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
  dateColumn("sale_date", "Огноо"),
  textColumn("contact_name", "Харилцагч"),
  currencyColumn("total_amount", "Нийт дүн"),
  currencyColumn("paid_amount", "Төлсөн дүн"),
  {
    accessorFn: (row) => (row.total_amount ?? 0) - (row.paid_amount ?? 0),
    id: "balance",
    header: "Үлдэгдэл",
    cell: ({ row }) =>
      formatCurrency(
        (row.original.total_amount ?? 0) - (row.original.paid_amount ?? 0),
      ),
  },
  {
    accessorFn: (row) => {
      const total = row.total_amount ?? 0;
      const paid = row.paid_amount ?? 0;
      if (paid >= total) return "Төлөгдсөн";
      if (paid > 0) return "Хэсэгчлэн";
      return "Төлөөгүй";
    },
    id: "payment_status",
    header: "Төлбөрийн төлөв",
    cell: ({ row }) => {
      const total = row.original.total_amount ?? 0;
      const paid = row.original.paid_amount ?? 0;
      let label: string;
      let variant: "default" | "secondary" | "destructive" | "outline";
      if (paid >= total) {
        label = "Төлөгдсөн";
        variant = "default";
      } else if (paid > 0) {
        label = "Хэсэгчлэн";
        variant = "secondary";
      } else {
        label = "Төлөөгүй";
        variant = "destructive";
      }
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "default" | "secondary" | "destructive" | "outline";
      switch (status) {
        case "completed":
          variant = "default";
          break;
        case "pending":
          variant = "secondary";
          break;
        case "cancelled":
          variant = "destructive";
          break;
        default:
          variant = "outline";
      }
      return <Badge variant={variant}>{statusLabel(status)}</Badge>;
    },
  },
  {
    accessorKey: "payment_method",
    header: "Төлбөрийн арга",
    cell: ({ row }) =>
      paymentMethodLabels[row.original.payment_method ?? ""] ??
      row.original.payment_method ??
      "-",
  },
];

export function SalesTable({
  data,
  onRowClick,
  loading,
}: {
  data: SaleRow[];
  onRowClick?: (row: SaleRow) => void;
  /** Inline skeleton rows while data is loading */
  loading?: boolean;
}) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onRowClick={onRowClick}
      searchColumn="contact_name"
      searchPlaceholder="Харилцагч хайх..."
      totalLabel="борлуулалт"
      enableSorting
      enableColumnVisibility
    />
  );
}
