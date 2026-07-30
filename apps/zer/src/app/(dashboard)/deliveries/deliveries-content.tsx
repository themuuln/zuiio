"use client";

import { Truck } from "@phosphor-icons/react/dist/ssr";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  type DeliveryDetailData,
  DeliveryDetailDrawer,
} from "./delivery-detail-drawer";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  assigned: "Даалгасан",
  picked_up: "Авсан",
  in_transit: "Замдаа",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
  failed: "Амжилтгүй",
};

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "delivered":
      return "default";
    case "pending":
    case "picked_up":
      return "secondary";
    case "cancelled":
    case "failed":
      return "destructive";
    case "assigned":
    case "in_transit":
      return "outline";
    default:
      return "outline";
  }
}

export function DeliveriesContent({
  deliveries,
}: {
  deliveries: DeliveryDataRow[];
}) {
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryDataRow | null>(null);

  if (deliveries.length === 0) {
    return (
      <PageShell
        title="Хүргэлт"
        description="Захиалгын хүргэлтийн бүртгэл, хяналт"
      >
        <ErpEmptyState
          icon={<Truck className="size-4" />}
          title="Хүргэлт байхгүй"
          description="Одоогоор бүртгэгдсэн хүргэлт байхгүй байна."
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<DeliveryDataRow>[] = [
    {
      accessorFn: (row) => row.sale_id?.slice(0, 8) ?? "-",
      id: "sale_id",
      header: "Захиалга",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.sale_id?.slice(0, 8) ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "contact_name",
      header: "Холбогдох хүн",
      cell: ({ row }) => row.original.contact_name,
    },
    {
      accessorKey: "contact_phone",
      header: "Утас",
      cell: ({ row }) => row.original.contact_phone,
    },
    {
      accessorKey: "address",
      header: "Хаяг",
      cell: ({ row }) => {
        const addr = row.original.address;
        return addr && addr.length > 40
          ? `${addr.slice(0, 40)}...`
          : (addr ?? "-");
      },
    },
    {
      accessorKey: "delivery_fee",
      header: "Хүргэлтийн төлбөр",
      cell: ({ row }) =>
        row.original.delivery_fee > 0
          ? formatCurrency(row.original.delivery_fee)
          : "Үнэгүй",
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      cell: ({ row }) => (
        <Badge variant={statusBadgeVariant(row.original.status)}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "assigned_name",
      header: "Хариуцагч",
      cell: ({ row }) => row.original.assigned_name ?? "-",
    },
    {
      accessorKey: "created_at",
      header: "Үүсгэсэн",
      cell: ({ row }) => formatDate(row.original.created_at),
    },
  ];

  return (
    <>
      <PageShell
        title="Хүргэлт"
        description="Захиалгын хүргэлтийн бүртгэл, хяналт"
      >
        <DataTable
          columns={columns}
          data={deliveries}
          searchColumn="contact_name"
          searchPlaceholder="Хайх..."
          pageSize={10}
          totalLabel="хүргэлт"
          enableSorting
          enableColumnVisibility
          onRowClick={(row) => setSelectedDelivery(row)}
        />
      </PageShell>
      <DeliveryDetailDrawer
        delivery={
          selectedDelivery
            ? (selectedDelivery as unknown as DeliveryDetailData)
            : ({} as DeliveryDetailData)
        }
        open={!!selectedDelivery}
        onOpenChange={(open) => {
          if (!open) setSelectedDelivery(null);
        }}
      />
    </>
  );
}

export interface DeliveryDataRow {
  id: string;
  sale_id: string;
  branch_id: string;
  address: string | null;
  contact_name: string;
  contact_phone: string;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  delivery_fee: number;
  notes: string | null;
  requested_at: string | null;
  estimated_at: string | null;
  delivered_at: string | null;
  created_at: string | null;
  sale_total: number | null;
  sale_contact_name: string | null;
}
