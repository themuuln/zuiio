"use client";

import { Percent } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DiscountCreateDrawer } from "@/components/discounts/discount-create-drawer";
import {
  type DiscountDetailData,
  DiscountDetailDrawer,
} from "@/components/discounts/discount-detail-drawer";
import {
  type DiscountEditData,
  DiscountEditDrawer,
} from "@/components/discounts/discount-edit-drawer";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { dateColumn, textColumn, actionsColumn } from "@/lib/table-columns";
import type { DiscountRow } from "./page";

const TYPE_LABELS: Record<string, string> = {
  percentage: "Хувь",
  fixed_amount: "Тогтмол дүн",
};

const APPLIES_TO_LABELS: Record<string, string> = {
  all: "Бүх бүтээгдэхүүн",
  selected_products: "Сонгосон бүтээгдэхүүн",
  selected_categories: "Сонгосон ангилал",
};

function toEditData(d: DiscountRow): DiscountEditData {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    type: d.type,
    value: d.value,
    applies_to: d.applies_to,
    min_purchase_amount: d.min_purchase_amount,
    valid_from: d.valid_from,
    valid_until: d.valid_until,
    is_active: d.is_active,
    usage_limit: d.usage_limit,
  };
}

export function DiscountsContent({ discounts }: { discounts: DiscountRow[] }) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRow | null>(
    null,
  );
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/discounts");
    }
  }, []);

  function toDetailData(d: DiscountRow): DiscountDetailData {
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      type: d.type,
      value: d.value,
      applies_to: d.applies_to,
      min_purchase_amount: d.min_purchase_amount,
      valid_from: d.valid_from,
      valid_until: d.valid_until,
      is_active: d.is_active,
      usage_limit: d.usage_limit,
      used_count: d.used_count,
      created_at: d.created_at,
    };
  }

  if (discounts.length === 0) {
    return (
      <PageShell
        title="Хямдрал, урамшуулал"
        description="Бүтээгдэхүүний хямдрал болон урамшууллын тохиргоо"
        actions={
          <DiscountCreateDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      >
        <ErpEmptyState
          icon={<Percent className="size-4" />}
          title="Хямдрал байхгүй"
          description="Шинэ хямдрал үүсгэж, үнийн урамшууллыг тохируулна уу."
          action={
            <DiscountCreateDrawer
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<DiscountRow>[] = [
    textColumn("name", "Нэр"),
    {
      accessorFn: (row) => TYPE_LABELS[row.type] ?? row.type,
      id: "type",
      header: "Төрөл",
      cell: ({ row }) => TYPE_LABELS[row.original.type] ?? row.original.type,
    },
    {
      accessorFn: (row) =>
        row.type === "percentage"
          ? `${row.value}%`
          : formatCurrency(row.value),
      id: "value",
      header: "Утга",
      cell: ({ row }) =>
        row.original.type === "percentage"
          ? `${row.original.value}%`
          : formatCurrency(row.original.value),
    },
    {
      accessorFn: (row) => APPLIES_TO_LABELS[row.applies_to] ?? row.applies_to,
      id: "applies_to",
      header: "Хамаарах хүрээ",
      cell: ({ row }) =>
        APPLIES_TO_LABELS[row.original.applies_to] ?? row.original.applies_to,
    },
    dateColumn("valid_from", "Хүчинтэй эхлэх"),
    {
      accessorFn: (row) =>
        row.valid_until ? formatDate(row.valid_until) : "Тодорхойгүй",
      id: "valid_until",
      header: "Хүчинтэй дуусах",
      cell: ({ row }) =>
        row.original.valid_until
          ? formatDate(row.original.valid_until)
          : "Тодорхойгүй",
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
      <DiscountEditDrawer discount={toEditData(row)} />
    )),
  ];

  return (
    <>
      <PageShell
        title="Хямдрал, урамшуулал"
        description="Бүтээгдэхүүний хямдрал болон урамшууллын тохиргоо"
        actions={
          <DiscountCreateDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      >
        <DataTable
          columns={columns}
          data={discounts}
          searchColumn="name"
          searchPlaceholder="Хайх..."
          pageSize={10}
          totalLabel="хямдрал"
          enableSorting
          enableColumnVisibility
          onRowClick={(row) => setSelectedDiscount(row)}
        />
      </PageShell>
      <DiscountDetailDrawer
        discount={
          selectedDiscount
            ? toDetailData(selectedDiscount)
            : ({} as DiscountDetailData)
        }
        open={!!selectedDiscount}
        onOpenChange={(open) => {
          if (!open) setSelectedDiscount(null);
        }}
      />
    </>
  );
}
