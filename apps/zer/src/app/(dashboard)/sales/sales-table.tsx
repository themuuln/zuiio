"use client";

import { ErpDataTable, type Column } from "@/components/erp/data-table";
import { Badge } from "@/components/ui/badge";
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

const columns: Column<SaleRow>[] = [
  {
    header: "Огноо",
    accessor: (row) => formatDate(row.sale_date),
    cellClassName: "whitespace-nowrap",
  },
  {
    header: "Харилцагч",
    accessor: (row) => row.contact_name ?? "-",
  },
  {
    header: "Нийт дүн",
    accessor: (row) => formatCurrency(Number(row.total_amount ?? 0)),
  },
  {
    header: "Төлсөн дүн",
    accessor: (row) => formatCurrency(Number(row.paid_amount ?? 0)),
    cellClassName: "hidden md:table-cell",
  },
  {
    header: "Үлдэгдэл",
    accessor: (row) =>
      formatCurrency(
        (row.total_amount ?? 0) - (row.paid_amount ?? 0),
      ),
    cellClassName: "hidden md:table-cell",
  },
  {
    header: "Төлбөрийн төлөв",
    accessor: (row) => {
      const total = row.total_amount ?? 0;
      const paid = row.paid_amount ?? 0;
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
    cellClassName: "hidden md:table-cell",
  },
  {
    header: "Статус",
    accessor: (row) => {
      const status = row.status;
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
    header: "Төлбөрийн арга",
    accessor: (row) =>
      paymentMethodLabels[row.payment_method ?? ""] ??
        row.payment_method ?? "-",
    cellClassName: "hidden md:table-cell",
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
    <ErpDataTable
      columns={columns}
      data={data}
      loading={loading}
      keyExtractor={(row) => row.id}
      onRowClick={onRowClick}
      emptyState={{
        title: "Борлуулалтын бүртгэл хоосон байна",
        description: "Шинэ борлуулалт үүсгэхэд барааны үлдэгдэл автоматаар буурна.",
      }}
    />
  );
}
