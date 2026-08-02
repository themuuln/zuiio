"use client";

import { Gift, NotePencil } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import {
  PromotionCreateDrawer,
  type PromotionDetailData,
  PromotionDetailDrawer,
} from "@/components/promotions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { actionsColumn } from "@/lib/table-columns";
import type { PromotionRow } from "./page";

const TYPE_LABELS: Record<string, string> = {
  buy_x_get_y: "1+1 / 2+1",
  threshold_discount: "Босго хямдрал",
  bundle_discount: "Багц хямдрал",
  free_shipping: "Үнэгүй хүргэлт",
};

function toDetailData(d: PromotionRow): PromotionDetailData {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    type: d.type,
    is_active: d.is_active,
    priority: d.priority,
    stackable: d.stackable,
    valid_from: d.valid_from,
    valid_until: d.valid_until,
    usage_limit: d.usage_limit,
    used_count: d.used_count,
    created_at: d.created_at,
  };
}

export function PromotionsContent({
  promotions,
}: {
  promotions: PromotionRow[];
}) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [selectedPromotion, setSelectedPromotion] =
    useState<PromotionRow | null>(null);
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/promotions");
    }
  }, []);

  if (promotions.length === 0) {
    return (
      <PageShell
        title="Сурталчилгаа"
        description="Урамшуулал, хямдралын тохиргоо"
      >
        <ErpEmptyState
          icon={<Gift className="size-4" />}
          title="Сурталчилгаа байхгүй"
          description="Шинэ сурталчилгаа үүсгэж, урамшууллын тохиргоог хийнэ үү."
          action={
            <PromotionCreateDrawer
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<PromotionRow>[] = [
    {
      accessorKey: "name",
      header: "Нэр",
    },
    {
      accessorFn: (row) => TYPE_LABELS[row.type] ?? row.type,
      id: "type",
      header: "Төрөл",
      cell: ({ row }) => TYPE_LABELS[row.original.type] ?? row.original.type,
    },
    {
      accessorFn: (row) => (row.is_active ? "Тийм" : "Үгүй"),
      id: "is_active",
      header: "Төлөв",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      ),
    },
    {
      id: "validity",
      header: "Хүчинтэй хугацаа",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.valid_from)} –{" "}
          {row.original.valid_until
            ? formatDate(row.original.valid_until)
            : "Тодорхойгүй"}
        </span>
      ),
    },
    {
      accessorKey: "conditions_count",
      header: "Нөхцөл",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.conditions_count}
        </span>
      ),
    },
    actionsColumn("", (row) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSelectedPromotion(row)}
      >
        <NotePencil className="size-4" />
      </Button>
    )),
  ];

  return (
    <>
      <PageShell
        title="Сурталчилгаа"
        description="Урамшуулал, хямдралын тохиргоо"
        actions={
          <PromotionCreateDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      >
        <DataTable
          columns={columns}
          data={promotions}
          searchColumn="name"
          searchPlaceholder="Хайх..."
          pageSize={10}
          totalLabel="сурталчилгаа"
          enableSorting
          enableColumnVisibility
          onRowClick={(row) => setSelectedPromotion(row)}
        />
      </PageShell>
      <PromotionDetailDrawer
        promotion={
          selectedPromotion
            ? toDetailData(selectedPromotion)
            : ({} as PromotionDetailData)
        }
        open={!!selectedPromotion}
        onOpenChange={(open) => {
          if (!open) setSelectedPromotion(null);
        }}
      />
    </>
  );
}
