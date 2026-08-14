"use client";

import { NotePencil, Tag } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CouponCreateDrawer,
  type CouponDetailData,
  CouponDetailDrawer,
  type CouponEditData,
  CouponEditDrawer,
} from "@/components/coupons";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { actionsColumn } from "@/lib/table-columns";
import type { CouponRow } from "./page";

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: "Хувь",
  fixed_amount: "Тогтмол дүн",
};

function toEditData(d: CouponRow): CouponEditData {
  return {
    id: d.id,
    code: d.code,
    discount_type: d.discount_type,
    discount_value: d.discount_value,
    min_purchase_amount: d.min_purchase_amount,
    max_discount_amount: d.max_discount_amount,
    valid_from: d.valid_from,
    valid_until: d.valid_until,
    usage_limit: d.usage_limit,
    per_customer_limit: d.per_customer_limit ?? 1,
    applies_to: d.applies_to,
    is_active: d.is_active,
    description: d.description,
    product_ids: d.product_ids,
    category_ids: d.category_ids,
  };
}

function toDetailData(d: CouponRow): CouponDetailData {
  return {
    ...toEditData(d),
    used_count: d.used_count,
    created_at: d.created_at,
  };
}

export function CouponsContent({ coupons }: { coupons: CouponRow[] }) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [selectedCoupon, setSelectedCoupon] = useState<CouponRow | null>(null);
  const [editCoupon, setEditCoupon] = useState<CouponEditData | null>(null);
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/coupons");
    }
  }, []);

  if (coupons.length === 0) {
    return (
      <PageShell title="Купон" description="Хөнгөлөлтийн купонуудын тохиргоо">
        <ErpEmptyState
          icon={<Tag className="size-4" />}
          title="Купон байхгүй"
          description="Шинэ купон үүсгэж, хөнгөлөлтийн тохиргоог хийнэ үү."
          action={
            <CouponCreateDrawer
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<CouponRow>[] = [
    {
      accessorKey: "code",
      header: "Код",
    },
    {
      accessorFn: (row) =>
        DISCOUNT_TYPE_LABELS[row.discount_type] ?? row.discount_type,
      id: "discount_type",
      header: "Хөнгөлөлтийн төрөл",
      cell: ({ row }) =>
        DISCOUNT_TYPE_LABELS[row.original.discount_type] ??
        row.original.discount_type,
    },
    {
      accessorFn: (row) =>
        row.discount_type === "percentage"
          ? `${row.discount_value}%`
          : formatCurrency(row.discount_value),
      id: "value",
      header: "Утга",
      cell: ({ row }) =>
        row.original.discount_type === "percentage"
          ? `${row.original.discount_value}%`
          : formatCurrency(row.original.discount_value),
    },
    {
      accessorFn: (row) =>
        row.usage_limit !== null
          ? `${row.used_count} / ${row.usage_limit}`
          : String(row.used_count),
      id: "usage",
      header: "Ашигласан",
      cell: ({ row }) =>
        row.original.usage_limit !== null
          ? `${row.original.used_count} / ${row.original.usage_limit}`
          : String(row.original.used_count),
    },
    {
      id: "valid_period",
      header: "Хүчинтэй хугацаа",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.valid_from)} –{" "}
          {row.original.valid_until
            ? formatDate(row.original.valid_until)
            : "Тодорхойгүй"}
        </span>
      ),
    },
    {
      accessorFn: (row) => (row.is_active ? "Тийм" : "Үгүй"),
      id: "is_active",
      header: "Идэвхтэй",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Тийм" : "Үгүй"}
        </Badge>
      ),
    },
    actionsColumn("", (row) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setEditCoupon(toEditData(row))}
      >
        <NotePencil className="size-4" />
      </Button>
    )),
  ];

  return (
    <>
      <PageShell
        title="Купон"
        description="Хөнгөлөлтийн купонуудын тохиргоо"
        actions={
          <CouponCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
        }
      >
        <DataTable
          columns={columns}
          data={coupons}
          searchColumn="code"
          searchPlaceholder="Хайх..."
          pageSize={10}
          totalLabel="купон"
          enableSorting
          enableColumnVisibility
          onRowClick={(row) => setSelectedCoupon(row)}
        />
      </PageShell>
      <CouponDetailDrawer
        coupon={
          selectedCoupon
            ? toDetailData(selectedCoupon)
            : ({} as CouponDetailData)
        }
        open={!!selectedCoupon}
        onOpenChange={(open) => {
          if (!open) setSelectedCoupon(null);
        }}
      />
      <CouponEditDrawer
        coupon={editCoupon ?? ({} as CouponEditData)}
        open={!!editCoupon}
        onOpenChange={(open) => {
          if (!open) setEditCoupon(null);
        }}
      />
    </>
  );
}
