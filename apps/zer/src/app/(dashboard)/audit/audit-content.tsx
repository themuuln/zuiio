"use client";

import { ErpDataTable } from "@/components/erp/data-table";
import { formatDate } from "@/lib/format";
import type { AuditLogRow } from "./page";

const ACTION_LABELS: Record<string, string> = {
  created: "Үүсгэсэн",
  updated: "Зассан",
  deleted: "Устгасан",
  status_changed: "Төлөв өөрчлөгдсөн",
  shared: "Хуваалцсан",
  payment_received: "Төлбөр хүлээн авсан",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  product: "Бүтээгдэхүүн",
  sale: "Борлуулалт",
  expense: "Зарлага",
  contact: "Харилцагч",
  invoice: "Нэхэмжлэл",
  category: "Ангилал",
  stock_movement: "Барааны хөдөлгөөн",
  warehouse: "Агуулах",
  brand: "Брэнд",
};

export function AuditContent({ rows }: { rows: AuditLogRow[] }) {
  return (
    <ErpDataTable
      title="Сүүлийн 100 үйлдэл"
      columns={[
        {
          header: "Огноо",
          accessor: (row: AuditLogRow) =>
            row.created_at ? formatDate(row.created_at) : "-",
          cellClassName: "whitespace-nowrap",
        },
        {
          header: "Хэрэглэгч",
          accessor: (row: AuditLogRow) => row.actor_name,
        },
        {
          header: "Үйлдэл",
          accessor: (row: AuditLogRow) =>
            ACTION_LABELS[row.action] ?? row.action,
        },
        {
          header: "Төрөл",
          accessor: (row: AuditLogRow) =>
            ENTITY_TYPE_LABELS[row.entity_type] ?? row.entity_type,
        },
        {
          header: "Тайлбар",
          accessor: (row: AuditLogRow) => (
            <span className="text-muted-foreground">{row.summary ?? "-"}</span>
          ),
        },
      ]}
      data={rows}
      keyExtractor={(row) => row.id}
      emptyState={{
        title: "Үйлдлийн түүх байхгүй",
        description: "Системд одоогоор бүртгэгдсэн үйлдэл байхгүй байна.",
      }}
    />
  );
}
