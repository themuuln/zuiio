"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Receipt } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageShell } from "@/components/erp/page-shell";
import { createClient } from "@/lib/supabase/client";
import { saleKeys } from "@/lib/query/keys";
import { useOrgSettings } from "@/lib/org-settings-context";

export const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()}₮`;
}

export type SaleItem = {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string | null;
  products: { name: string; unit: string | null } | null;
};

export type SaleData = {
  id: string;
  total_amount: number;
  paid_amount: number | null;
  payment_method: string | null;
  status: string | null;
  sale_date: string;
  created_at: string | null;
  contact_id: string | null;
  contacts: { name: string } | null;
  salesperson_id: string | null;
  profiles: { full_name: string | null } | null;
};

export function ReceiptContent({
  saleId,
  orgId,
}: {
  saleId?: string;
  orgId?: string;
} = {}) {
  const params = useParams<{ id: string }>();
  const id = saleId ?? params.id;
  const { organizationId } = useOrgSettings();
  const effectiveOrgId = orgId ?? organizationId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: async () => {
      const supabase = createClient();

      const [orgResult, saleResult, itemsResult] = await Promise.all([
        supabase
          .from("organizations")
          .select("name")
          .eq("id", effectiveOrgId)
          .single(),
        supabase
          .from("sales")
          .select(
            "id, total_amount, paid_amount, payment_method, status, sale_date, created_at, contact_id, contacts(name), salesperson_id, profiles!sales_salesperson_id_fkey(full_name)",
          )
          .eq("id", id)
          .eq("organization_id", effectiveOrgId)
          .single(),
        supabase
          .from("sale_items")
          .select(
            "id, quantity, unit_price, total_price, product_id, products(name, unit)",
          )
          .eq("sale_id", id)
          .order("id", { ascending: true }),
      ]);

      if (!saleResult.data) {
        // Expected null state — UI renders "not found" empty state
        return null;
      }

      return {
        sale: saleResult.data as unknown as SaleData,
        items: (itemsResult.data ?? []) as SaleItem[],
        organizationName: orgResult.data?.name ?? "Дэлгүүр",
      };
    },
  });

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : "Алдаа гарлаа"
    : null;

  const sale = data?.sale;
  const items = data?.items ?? [];
  const organizationName = data?.organizationName ?? "Дэлгүүр";

  const paidAmount = Number(sale?.paid_amount ?? 0);
  const totalAmount = Number(sale?.total_amount ?? 0);
  const change = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const paymentLabel = sale?.payment_method
    ? (paymentMethodLabels[sale.payment_method] ?? sale.payment_method)
    : "-";

  return (
    <PageShell
      title="Баримт"
      description="Баримтын дэлгэрэнгүй"
      loading={isLoading}
      error={errorMessage}
      onRetry={() => refetch()}
    >
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      ) : !sale ? (
        <div className="flex flex-col gap-4 pb-20">
          <div className="no-print mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Түүх рүү буцах</p>
          </div>
          <h1 className="text-lg font-semibold">Баримт</h1>
          <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Receipt className="size-6" />
              </EmptyMedia>
              <EmptyTitle>Баримт олдсонгүй</EmptyTitle>
              <EmptyDescription>
                Энэ баримт олдсонгүй эсвэл устгагдсан байна.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Receipt header */}
          <div className="flex flex-col items-center gap-1 border-b border-border pb-4">
            <h1 className="text-lg font-semibold">{organizationName}</h1>
            <p className="text-xs text-muted-foreground">
              Баримт #{(sale.id ?? "").slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(sale.created_at ?? sale.sale_date)}
            </p>
          </div>

          {/* Customer name */}
          {sale.contacts?.name && (
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Харилцагч</p>
              <p className="text-sm font-medium">{sale.contacts.name}</p>
            </div>
          )}

          {/* Salesperson name */}
          {sale.profiles?.full_name && (
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Борлуулагч</p>
              <p className="text-sm font-medium">{sale.profiles.full_name}</p>
            </div>
          )}

          {/* Items */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">
              Борлуулалтын мөрүүд
            </p>
            <Card size="sm">
              <CardContent className="flex flex-col gap-2 px-3 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex-[2]">Бараа</span>
                  <span className="w-12 text-right">Тоо</span>
                  <span className="w-20 text-right">Үнэ</span>
                  <span className="w-20 text-right">Дүн</span>
                </div>
                <div className="border-t border-border" />
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex-[2] truncate text-sm font-medium">
                      {item.products?.name ??
                        `Бүтээгдэхүүн #${(item.product_id ?? "").slice(0, 8)}`}
                    </span>
                    <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                      {item.quantity}
                      {item.products?.unit ? ` ${item.products.unit}` : ""}
                    </span>
                    <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(item.unit_price)}
                    </span>
                    <span className="w-20 text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Нийт дүн</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Төлбөрийн хэлбэр</span>
                <span className="font-medium">{paymentLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Төлсөн дүн</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(paidAmount)}
                </span>
              </div>
              {change > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Өөрчлөлт</span>
                  <span className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Статус</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {sale.status === "completed"
                    ? "Гүйцэтгэсэн"
                    : (sale.status ?? "-")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
