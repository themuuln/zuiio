"use client";

import { ClockCounterClockwise, User } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { createContext, useContext, useState } from "react";
import type { SaleDetailData } from "@/components/sales/sale-detail-drawer";
import { SaleDetailDrawer } from "@/components/sales/sale-detail-drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { formatCurrency, formatDate } from "@/lib/format";
import { saleKeys } from "@/lib/query/keys";
import { filterOnlineSales, onlineBuyerLabel } from "@/lib/shop-online-sales";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────

const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

function getStatusBadgeClass(status: string | null): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function getStatusLabel(status: string | null): string {
  switch (status) {
    case "completed":
      return "Дууссан";
    case "pending":
      return "Хүлээгдэж буй";
    case "cancelled":
      return "Цуцлагдсан";
    default:
      return status ?? "-";
  }
}

type SaleRow = {
  id: string;
  total_amount: number;
  paid_amount: number | null;
  payment_method: string | null;
  status: string | null;
  sale_date: string;
  created_at: string | null;
  contacts: { name: string } | null;
  profiles: { full_name: string | null } | null;
  store_accounts: { display_name: string | null; email: string } | null;
  is_online: boolean;
  item_count: number;
};

// ── Context ──────────────────────────────────────────────────────

interface ShopHistoryContextValue {
  open: () => void;
}

const ShopHistoryContext = createContext<ShopHistoryContextValue | null>(null);

export function useShopHistoryDrawer(): ShopHistoryContextValue {
  const ctx = useContext(ShopHistoryContext);
  if (!ctx) {
    // Fallback — allows the hook to be used outside the provider without crashing
    return { open: () => {} };
  }
  return ctx;
}

export function ShopHistoryProvider({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ShopHistoryContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <ShopHistoryDrawer orgId={orgId} open={open} onOpenChange={setOpen} />
    </ShopHistoryContext.Provider>
  );
}

// ── Drawer ───────────────────────────────────────────────────────

function ShopHistoryDrawer({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<SaleDetailData | null>(null);
  const [onlineOnly, setOnlineOnly] = useState(false);

  // Fetch sales list
  const { data: sales, isLoading } = useQuery({
    queryKey: saleKeys.lists(orgId),
    enabled: open,
    queryFn: async (): Promise<SaleRow[]> => {
      const supabase = createClient();

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select(
          "id, total_amount, paid_amount, payment_method, status, sale_date, created_at, contact_id, contacts(name), salesperson_id, profiles!sales_salesperson_id_fkey(full_name), store_accounts(display_name, email), is_online",
        )
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (saleError) capture(saleError);

      if (!saleData || saleData.length === 0) return [];

      // Fetch item counts
      const saleIds = saleData.map((s) => s.id);
      const { data: saleItems, error: saleItemsError } = await supabase
        .from("sale_items")
        .select("sale_id")
        .in("sale_id", saleIds);

      if (saleItemsError) capture(saleItemsError);

      const itemCountMap = new Map<string, number>();
      for (const item of saleItems ?? []) {
        itemCountMap.set(
          item.sale_id,
          (itemCountMap.get(item.sale_id) ?? 0) + 1,
        );
      }

      return saleData.map((sale) => ({
        ...sale,
        item_count: itemCountMap.get(sale.id) ?? 0,
      })) as SaleRow[];
    },
  });

  // Fetch sale detail when a row is clicked
  const handleSaleClick = async (saleId: string) => {
    const supabase = createClient();

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(
        "id, sale_date, total_amount, paid_amount, payment_method, status, notes, contact_id, contacts(name), salesperson_id, profiles!sales_salesperson_id_fkey(full_name)",
      )
      .eq("organization_id", orgId)
      .eq("id", saleId)
      .single();

    if (saleError) capture(saleError);

    if (!sale) return;

    const { data: saleItems, error: saleItemsError } = await supabase
      .from("sale_items")
      .select(
        "id, quantity, unit_price, total_price, product_id, products(name, unit)",
      )
      .eq("sale_id", saleId)
      .order("id", { ascending: true });

    if (saleItemsError) capture(saleItemsError);

    const detail: SaleDetailData = {
      id: sale.id,
      sale_date: sale.sale_date,
      total_amount: sale.total_amount,
      paid_amount: sale.paid_amount,
      payment_method: sale.payment_method,
      status: sale.status,
      notes: sale.notes,
      contacts: sale.contacts as { name: string } | null,
      salesperson_name:
        (sale.profiles as { full_name: string | null } | null)?.full_name ??
        null,
      sale_items: (saleItems ?? []).map((item) => ({
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

    setDetailData(detail);
    setSelectedSaleId(saleId);
  };

  return (
    <>
      <SlideInDrawer
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) setSelectedSaleId(null);
        }}
        title="Борлуулалтын түүх"
        panelWidth="32rem"
      >
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">Уншиж байна...</p>
          </div>
        ) : !sales || sales.length === 0 ? (
          <Empty className="min-h-[200px] rounded-xl border border-dashed border-border bg-card/50">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClockCounterClockwise className="size-6" />
              </EmptyMedia>
              <EmptyTitle>Борлуулалт байхгүй</EmptyTitle>
              <EmptyDescription>
                Борлуулалт хийгдсэний дараа энд харагдах болно.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
            <button
              type="button"
              onClick={() => setOnlineOnly((v) => !v)}
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                onlineOnly
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Онлайн захиалга
            </button>
            {filterOnlineSales(sales, onlineOnly).map((sale) => {
              const paymentLabel =
                paymentMethodLabels[sale.payment_method ?? ""] ??
                sale.payment_method ??
                "-";
              const buyerLabel = onlineBuyerLabel(sale);

              return (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => handleSaleClick(sale.id)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                >
                  {/* Left: date and ID */}
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {formatDate(sale.created_at ?? sale.sale_date)}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      #{sale.id.slice(0, 8).toUpperCase()}
                      {buyerLabel && <> · {buyerLabel}</>}
                      {sale.profiles?.full_name && (
                        <>
                          {" · "}
                          <User
                            className="mr-0.5 inline-block size-3 align-text-bottom"
                            weight="bold"
                          />
                          {sale.profiles.full_name}
                        </>
                      )}
                    </span>
                  </div>
                  {/* Right: amount, item count, status */}
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(Number(sale.total_amount))}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {sale.item_count} зүйл
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {paymentLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {sale.is_online && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium leading-none text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Онлайн
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${getStatusBadgeClass(sale.status)}`}
                      >
                        {getStatusLabel(sale.status)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SlideInDrawer>

      {/* Detail drawer (nested) */}
      <SaleDetailDrawer
        sale={detailData ?? ({} as SaleDetailData)}
        open={!!(detailData && selectedSaleId)}
        onOpenChange={() => {
          setSelectedSaleId(null);
          setDetailData(null);
        }}
      />
    </>
  );
}
