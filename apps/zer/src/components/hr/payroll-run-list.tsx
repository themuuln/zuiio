"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format";

type PayrollRunRow = {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_gross: number;
  total_net: number;
  total_si_employee: number;
  created_at: string;
};

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Ноорог", variant: "secondary" },
  calculated: { label: "Бодогдсон", variant: "outline" },
  approved: { label: "Баталгаажсан", variant: "default" },
  paid: { label: "Төлөгдсөн", variant: "default" },
};

const columns: ColumnDef<PayrollRunRow>[] = [
  {
    accessorKey: "period_start",
    header: "Эхлэл",
    cell: ({ row }) =>
      format(new Date(row.getValue("period_start")), "yyyy-MM-dd"),
  },
  {
    accessorKey: "period_end",
    header: "Дуусах",
    cell: ({ row }) =>
      format(new Date(row.getValue("period_end")), "yyyy-MM-dd"),
  },
  {
    accessorKey: "total_gross",
    header: "Нийт цалин",
    cell: ({ row }) => formatCurrency(row.getValue("total_gross") as number),
  },
  {
    accessorKey: "total_si_employee",
    header: "НД шимтгэл",
    cell: ({ row }) =>
      formatCurrency(row.getValue("total_si_employee") as number),
  },
  {
    accessorKey: "total_net",
    header: "Гарт олгох",
    cell: ({ row }) => formatCurrency(row.getValue("total_net") as number),
  },
  {
    accessorKey: "status",
    header: "Төлөв",
    cell: ({ row }) => {
      const s = STATUS_MAP[row.getValue("status") as string] ?? {
        label: row.getValue("status"),
        variant: "secondary",
      };
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
];

export function PayrollRunList({ data }: { data: PayrollRunRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumn="period_start"
      searchPlaceholder="Хугацаагаар хайх..."
      pageSize={10}
      totalLabel="цалингийн бүртгэл"
    />
  );
}
