"use client";

import { useQuery } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import {
  type SaleDetailData,
  SaleDetailDrawer,
} from "@/components/sales/sale-detail-drawer";
import { SalesCreateDrawer } from "@/components/sales/sales-create-drawer";
import { createClient } from "@/lib/supabase/client";
import type { SaleRow } from "./sales-table";
import { SalesTable } from "./sales-table";

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  barcode: string | null;
  image_url: string | null;
};

async function fetchSaleWithItems(
  saleId: string,
): Promise<SaleDetailData | null> {
  const supabase = createClient();
  const { data: sale } = await supabase
    .from("sales")
    .select("*, contacts(name), profiles!sales_salesperson_id_fkey(full_name)")
    .eq("id", saleId)
    .single();
  if (!sale) return null;

  const { data: items } = await supabase
    .from("sale_items")
    .select("*, products(name, unit)")
    .eq("sale_id", saleId);

  const profilesData = sale.profiles as { full_name: string | null } | null;

  return {
    id: sale.id,
    sale_date: sale.sale_date,
    total_amount: sale.total_amount,
    paid_amount: sale.paid_amount,
    payment_method: sale.payment_method,
    status: sale.status,
    notes: sale.notes,
    contacts: sale.contacts as { name: string } | null,
    salesperson_name: profilesData?.full_name ?? null,
    sale_items: (items ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      product: item.products as {
        id: string;
        name: string;
        unit: string | null;
      } | null,
    })),
  };
}

type FilterChip =
  | "today"
  | "week"
  | "hasBalance"
  | "fullyPaid"
  | "cancelled"
  | "cash"
  | "card";

const FILTER_CHIPS: {
  key: FilterChip;
  label: string;
}[] = [
  { key: "today", label: "Өнөөдөр" },
  { key: "week", label: "7 хоног" },
  { key: "hasBalance", label: "Үлдэгдэлтэй" },
  { key: "fullyPaid", label: "Бүрэн төлөгдсөн" },
  { key: "cancelled", label: "Цуцлагдсан" },
  { key: "cash", label: "Бэлэн" },
  { key: "card", label: "Карт" },
];

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isWithinWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo;
}

export function SalesContent({
  sales,
  products,
}: {
  sales: SaleRow[];
  products: ProductOption[];
}) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [activeChips, setActiveChips] = useState<Set<FilterChip>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const initialRef = useRef(createOpen);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/sales");
    }
  }, []);

  const toggleChip = (chip: FilterChip) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) {
        next.delete(chip);
      } else {
        next.add(chip);
      }
      return next;
    });
  };

  const filteredSales = useMemo(() => {
    if (activeChips.size === 0) return sales;
    return sales.filter((sale) => {
      for (const chip of activeChips) {
        switch (chip) {
          case "today":
            if (!isToday(sale.sale_date)) return false;
            break;
          case "week":
            if (!isWithinWeek(sale.sale_date)) return false;
            break;
          case "hasBalance":
            if ((sale.total_amount ?? 0) <= (sale.paid_amount ?? 0))
              return false;
            break;
          case "fullyPaid":
            if ((sale.paid_amount ?? 0) < (sale.total_amount ?? 0))
              return false;
            break;
          case "cancelled":
            if (sale.status !== "cancelled") return false;
            break;
          case "cash":
            if (sale.payment_method !== "cash") return false;
            break;
          case "card":
            if (sale.payment_method !== "card") return false;
            break;
        }
      }
      return true;
    });
  }, [sales, activeChips]);

  // ── Sale detail fetching — errors are shown inline via PageShell ──
  const {
    data: selectedSale,
    error: detailError,
    isFetching: detailFetching,
  } = useQuery({
    queryKey: ["sale-detail", selectedSaleId],
    queryFn: async () => {
      if (!selectedSaleId) return null;
      try {
        return await fetchSaleWithItems(selectedSaleId);
      } catch (e) {
        capture(e, { context: "sales: fetch sale detail" });
        setError("Борлуулалтын дэлгэрэнгүй мэдээлэл ачаалахад алдаа гарлаа.");
        throw e;
      }
    },
    enabled: !!selectedSaleId,
  });

  return (
    <>
      <PageShell
        title="Борлуулалт"
        description="Борлуулалтын жагсаалт, статус, төлбөрийн мэдээлэл."
        error={error}
        onRetry={() => {
          setError(null);
          setSelectedSaleId(null);
        }}
        actions={
          <>
            <ExportButton
              href="/api/export/sales"
              filename={`sales-${new Date().toISOString().slice(0, 10)}.csv`}
            />
            <SalesCreateDrawer
              products={products}
              open={createOpen}
              onOpenChangeAction={setCreateOpen}
              onOpenDetailAction={(saleId) => {
                setCreateOpen(false);
                setSelectedSaleId(saleId);
              }}
            />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Quick filter chips — always render for PPR structure */}
          <div className="flex flex-wrap gap-2">
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeChips.has(chip.key);
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => toggleChip(chip.key)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* SalesTable handles its own loading and empty state */}
          <SalesTable
            data={filteredSales}
            onRowClick={(row) => setSelectedSaleId(row.id)}
          />
        </div>
      </PageShell>
      {/* Detail drawer */}
      <SaleDetailDrawer
        sale={selectedSale ?? ({} as SaleDetailData)}
        open={!!selectedSale}
        onOpenChange={(open) => {
          if (!open) setSelectedSaleId(null);
        }}
      />
    </>
  );
}
