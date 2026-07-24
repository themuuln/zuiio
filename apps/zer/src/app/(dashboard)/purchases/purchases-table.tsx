"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

import { PurchaseDetailDrawer } from "@/components/purchases/purchase-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { currencyColumn, dateColumn } from "@/lib/table-columns";

export type PurchaseRow = {
  id: string;
  order_number: string;
  order_date: string;
  expected_date: string | null;
  status: string;
  total_amount: number | null;
  notes: string | null;
  created_at: string | null;
  supplier_name: string | null;
  created_by_name: string | null;
};

export type PurchaseDetail = PurchaseRow & {
  items: Array<{
    id: string;
    product_id: string | null;
    product_name: string | null;
    description: string | null;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    received_quantity: number;
  }>;
};

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "received":
      return "default";
    case "sent":
      return "secondary";
    case "partially_received":
      return "secondary";
    case "draft":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Ноорог";
    case "sent":
      return "Илгээсэн";
    case "partially_received":
      return "Хэсэгчлэн хүлээн авсан";
    case "received":
      return "Хүлээн авсан";
    case "cancelled":
      return "Цуцлагдсан";
    default:
      return status;
  }
}

const columns: ColumnDef<PurchaseRow>[] = [
  {
    accessorKey: "order_number",
    header: "Захиалгын дугаар",
    filterFn: (row, _columnId, filterValue: string) => {
      const orderNum = String(row.getValue("order_number") ?? "").toLowerCase();
      const supplier = String(
        row.getValue("supplier_name") ?? "",
      ).toLowerCase();
      const amount = String(row.getValue("total_amount") ?? "").toLowerCase();
      const search = filterValue.toLowerCase();
      return (
        orderNum.includes(search) ||
        supplier.includes(search) ||
        amount.includes(search)
      );
    },
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium">
        {row.getValue("order_number")}
      </span>
    ),
  },
  {
    accessorKey: "supplier_name",
    header: "Нийлүүлэгч",
    cell: ({ row }) => row.getValue("supplier_name") ?? "-",
  },
  dateColumn("order_date", "Огноо"),
  dateColumn("expected_date", "Хүлээгдэж буй огноо"),
  currencyColumn("total_amount", "Дүн"),
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={statusBadgeVariant(status)}>
          {statusLabel(status)}
        </Badge>
      );
    },
  },
];

export function PurchasesTable({
  data,
  loading,
}: {
  data: PurchaseRow[];
  loading?: boolean;
}) {
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(
    null,
  );

  return (
    <>
      <DataTable
        columns={columns}
        loading={loading}
        data={data}
        searchColumn="order_number"
        searchPlaceholder="Захиалгын дугаар, нийлүүлэгч, дүнгээр хайх..."
        pageSize={10}
        totalLabel="захиалга"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelectedPurchaseId(row.id)}
      />
      <PurchaseDetailDrawer
        purchaseOrderId={selectedPurchaseId}
        onClose={() => setSelectedPurchaseId(null)}
      />
    </>
  );
}
