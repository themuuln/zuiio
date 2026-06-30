"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { EmployeeDetailDrawer } from "@/components/hr/employee-detail-drawer";
import { EmployeeEditDrawer } from "@/components/hr/employee-edit-drawer";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { TableActionsCell } from "@/components/ui/table-actions-cell";
import { formatCurrency } from "@/lib/format";

type EmployeeRow = {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  hire_date: string;
  contract_type: string;
  base_salary: number;
  salary_type: string;
  is_active: boolean;
  branch_id: string | null;
  bank_account: string | null;
  created_at: string;
};

function statusBadge(isActive: boolean) {
  return isActive
    ? { label: "Идэвхтэй", variant: "default" as const }
    : { label: "Идэвхгүй", variant: "secondary" as const };
}

const CONTRACT_LABELS: Record<string, string> = {
  permanent: "Байнгын",
  temporary: "Түр",
  contract: "Гэрээт",
};

function buildColumns(
  onEdit: (employee: EmployeeRow) => void,
): ColumnDef<EmployeeRow>[] {
  return [
    {
      accessorKey: "full_name",
      header: "Нэр",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("full_name")}</span>
      ),
    },
    {
      accessorKey: "position",
      header: "Албан тушаал",
      cell: ({ row }) => row.getValue("position") ?? "-",
    },
    {
      accessorKey: "department",
      header: "Хэлтэс",
      cell: ({ row }) => row.getValue("department") ?? "-",
    },
    {
      accessorKey: "contract_type",
      header: "Гэрээний төрөл",
      cell: ({ row }) =>
        CONTRACT_LABELS[row.getValue("contract_type") as string] ??
        row.getValue("contract_type"),
    },
    {
      accessorKey: "base_salary",
      header: "Цалин",
      cell: ({ row }) => formatCurrency(row.getValue("base_salary") as number),
    },
    {
      accessorKey: "is_active",
      header: "Төлөв",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean;
        const s = statusBadge(active);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <TableActionsCell onEdit={() => onEdit(row.original)} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function EmployeeTable({ data }: { data: EmployeeRow[] }) {
  const [selected, setSelected] = useState<EmployeeRow | null>(null);
  const [editItem, setEditItem] = useState<EmployeeRow | null>(null);

  return (
    <>
      <DataTable
        columns={buildColumns(setEditItem)}
        data={data}
        searchColumn="full_name"
        searchPlaceholder="Ажилтнаар хайх..."
        pageSize={10}
        totalLabel="ажилтан"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelected(row)}
      />
      {selected && (
        <EmployeeDetailDrawer
          employee={selected}
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          onEdit={() => setEditItem(selected)}
        />
      )}
      {editItem && (
        <EmployeeEditDrawer
          employee={editItem}
          open={!!editItem}
          onOpenChange={(open) => {
            if (!open) setEditItem(null);
          }}
        />
      )}
    </>
  );
}
