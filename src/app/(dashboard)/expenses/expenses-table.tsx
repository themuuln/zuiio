"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";

export type ExpenseRow = {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  description: string | null;
  payment_method: string | null;
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

const columns: ColumnDef<ExpenseRow>[] = [
  {
    accessorKey: "expense_date",
    header: "Огноо",
    cell: ({ row }) => formatDate(row.getValue("expense_date")),
  },
  {
    accessorKey: "category",
    header: "Ангилал",
    filterFn: (row, _columnId, filterValue: string) => {
      const category = String(row.getValue("category") ?? "").toLowerCase();
      const description = String(
        row.getValue("description") ?? "",
      ).toLowerCase();
      const search = filterValue.toLowerCase();
      return category.includes(search) || description.includes(search);
    },
  },
  {
    accessorKey: "amount",
    header: "Дүн",
    cell: ({ row }) => formatCurrency(Number(row.getValue("amount") ?? 0)),
  },
  {
    accessorKey: "payment_method",
    header: "Төлбөрийн арга",
    cell: ({ row }) => {
      const method = row.getValue("payment_method") as string | null;
      return paymentMethodLabels[method ?? ""] ?? method ?? "-";
    },
  },
  {
    accessorKey: "description",
    header: "Тайлбар",
    cell: ({ row }) => row.getValue("description") ?? "-",
  },
];

export function ExpensesTable({ data }: { data: ExpenseRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumn="category"
      searchPlaceholder="Ангилал, тайлбараар хайх..."
      pageSize={10}
      totalLabel="зарлага"
    />
  );
}
