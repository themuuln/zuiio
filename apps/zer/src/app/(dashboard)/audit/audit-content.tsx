"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { dateColumn, textColumn } from "@/lib/table-columns";
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

const columns: ColumnDef<AuditLogRow>[] = [
  dateColumn("created_at", "Огноо"),
  textColumn("actor_name", "Хэрэглэгч"),
  {
    id: "action",
    header: "Үйлдэл",
    accessorFn: (row) => ACTION_LABELS[row.action] ?? row.action,
    cell: ({ row }) => (
      <span>{ACTION_LABELS[row.original.action] ?? row.original.action}</span>
    ),
  },
  {
    id: "entity_type",
    header: "Төрөл",
    accessorFn: (row) => ENTITY_TYPE_LABELS[row.entity_type] ?? row.entity_type,
    cell: ({ row }) => (
      <span>
        {ENTITY_TYPE_LABELS[row.original.entity_type] ??
          row.original.entity_type}
      </span>
    ),
  },
  textColumn("summary", "Тайлбар"),
];

export function AuditContent({ rows }: { rows: AuditLogRow[] }) {
  if (rows.length === 0) {
    return (
      <ErpEmptyState
        title="Үйлдлийн түүх байхгүй"
        description="Системд одоогоор бүртгэгдсэн үйлдэл байхгүй байна."
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchColumn="actor_name"
      searchPlaceholder="Хэрэглэгчээр хайх..."
      pageSize={10}
      totalLabel="үйлдэл"
      enableSorting
      enableColumnVisibility
    />
  );
}
