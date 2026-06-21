"use client";

import { Percent } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DiscountCreateDrawer } from "@/components/discounts/discount-create-drawer";
import {
  type DiscountDetailData,
  DiscountDetailDrawer,
} from "@/components/discounts/discount-detail-drawer";
import { ErpDataTable } from "@/components/erp/data-table";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
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
        <ErpDataTable
          title="Хямдралын жагсаалт"
          columns={[
            { header: "Нэр", accessor: (d: DiscountRow) => d.name },
            {
              header: "Төрөл",
              accessor: (d: DiscountRow) => TYPE_LABELS[d.type] ?? d.type,
            },
            {
              header: "Утга",
              accessor: (d: DiscountRow) =>
                d.type === "percentage"
                  ? `${d.value}%`
                  : formatCurrency(d.value),
            },
            {
              header: "Хамаарах хүрээ",
              accessor: (d: DiscountRow) =>
                APPLIES_TO_LABELS[d.applies_to] ?? d.applies_to,
            },
            {
              header: "Хүчинтэй эхлэх",
              accessor: (d: DiscountRow) => formatDate(d.valid_from),
            },
            {
              header: "Хүчинтэй дуусах",
              accessor: (d: DiscountRow) =>
                d.valid_until ? formatDate(d.valid_until) : "Тодорхойгүй",
            },
            {
              header: "Ашигласан",
              accessor: (d: DiscountRow) =>
                d.usage_limit !== null
                  ? `${d.used_count} / ${d.usage_limit}`
                  : String(d.used_count),
            },
            {
              header: "Идэвхтэй",
              accessor: (d: DiscountRow) => (
                <Badge variant={d.is_active ? "default" : "secondary"}>
                  {d.is_active ? "Тийм" : "Үгүй"}
                </Badge>
              ),
            },
          ]}
          data={discounts}
          onRowClick={(d) => setSelectedDiscount(d)}
          keyExtractor={(d) => d.id}
          emptyState={{
            icon: <Percent className="size-4" />,
            title: "Хямдрал байхгүй",
            description:
              "Шинэ хямдрал үүсгэж, үнийн урамшууллыг тохируулна уу.",
            action: (
              <DiscountCreateDrawer
                open={createOpen}
                onOpenChange={setCreateOpen}
              />
            ),
          }}
        />
      </PageShell>
      {selectedDiscount && (
        <DiscountDetailDrawer
          discount={toDetailData(selectedDiscount)}
          open={!!selectedDiscount}
          onOpenChange={(open) => {
            if (!open) setSelectedDiscount(null);
          }}
        />
      )}
    </>
  );
}
