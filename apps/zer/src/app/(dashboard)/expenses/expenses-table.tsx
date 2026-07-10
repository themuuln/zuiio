"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

import {
  type ExpenseDetailData,
  ExpenseDetailDrawer,
} from "@/components/expenses/expense-detail-drawer";
import {
  type ExpenseEditData,
  ExpenseEditDrawer,
} from "@/components/expenses/expense-edit-drawer";
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

function toDetailData(expense: ExpenseRow): ExpenseDetailData {
  return {
    id: expense.id,
    expense_date: expense.expense_date,
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
    payment_method: expense.payment_method,
  };
}

function toEditData(expense: ExpenseRow): ExpenseEditData {
  return {
    id: expense.id,
    expense_date: expense.expense_date,
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
    payment_method: expense.payment_method,
  };
}

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

export function ExpensesTable({ data, loading }: { data: ExpenseRow[]; loading?: boolean }) {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRow | null>(
    null,
  );

  return (
    <>
      <DataTable
        columns={[
          ...columns,
          {
            id: "actions",
            header: "",
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => (
              <div onClick={(e) => e.stopPropagation()} role="none">
                <ExpenseEditDrawer expense={toEditData(row.original)} />
              </div>
            ),
          },
        ]}
        data={data}
        loading={loading}
        searchColumn="category"
        searchPlaceholder="Ангилал, тайлбараар хайх..."
        pageSize={10}
        totalLabel="зарлага"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelectedExpense(row)}
      />
      <ExpenseDetailDrawer
        expense={selectedExpense ? toDetailData(selectedExpense) : ({} as ExpenseDetailData)}
        open={!!selectedExpense}
        onOpenChange={(open) => {
          if (!open) setSelectedExpense(null);
        }}
      />
    </>
  );
}
