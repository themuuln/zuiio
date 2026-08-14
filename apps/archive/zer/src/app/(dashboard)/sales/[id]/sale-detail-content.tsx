"use client";

import { Printer } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { useOrgSettings } from "@/lib/org-settings-context";
import { saleKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-600 hover:bg-green-700 dark:bg-green-500">
          Дууссан
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          Хүлээгдэж буй
        </Badge>
      );
    case "cancelled":
      return <Badge variant="destructive">Цуцлагдсан</Badge>;
    default:
      return <Badge variant="outline">{status ?? "-"}</Badge>;
  }
}

export function SaleDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { organizationId } = useOrgSettings();
  const { t } = useI18n();
  // Fire window.print() at most once per page load when arriving with ?print=1
  // (receipt-printer orgs navigate here straight after a sale).
  const printTriggeredRef = useRef(false);

  const { data: sale, isLoading } = useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:sale_detail",
        supabase
          .from("sales")
          .select(
            "id, total_amount, paid_amount, sale_date, status, payment_method, branch_id, contacts(name), salesperson_id, profiles!sales_salesperson_id_fkey(full_name)",
          )
          .eq("organization_id", organizationId)
          .eq("id", id)
          .single(),
      );
      if (error) throw error;
      if (!data) throw new Error("Борлуулалт олдсонгүй");
      return data;
    },
    enabled: !!organizationId && !!id,
  });

  const { data: items } = useQuery({
    queryKey: ["sales", "items", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:sale_detail_items",
        supabase
          .from("sale_items")
          .select(
            "id, quantity, unit_price, total_price, commission_amount, product_id, products(name, unit)",
          )
          .eq("sale_id", id)
          .order("id", { ascending: true }),
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  // Release parsed join fields from their Json containers.
  // Sale contacts — guaranteed shape by .select("contacts(name)")
  const saleContact = sale?.contacts as { name: string } | null;
  const contactName = saleContact?.name ?? null;

  // Salesperson profile — guaranteed shape by .select("profiles!sales_salesperson_id_fkey(full_name)")
  const salespersonProfile = sale?.profiles as {
    full_name: string | null;
  } | null;
  const salespersonName = salespersonProfile?.full_name ?? null;

  // Auto-print once the sale data has loaded (receipt-printer orgs).
  useEffect(() => {
    if (searchParams.get("print") !== "1") return;
    if (isLoading || !sale) return;
    if (printTriggeredRef.current) return;
    printTriggeredRef.current = true;
    window.print();
  }, [searchParams, isLoading, sale]);

  return (
    <PageShell
      title="Борлуулалтын дэлгэрэнгүй"
      description={
        isLoading
          ? "..."
          : sale
            ? `#${sale.id.slice(0, 8).toUpperCase()} · ${formatDate(sale.sale_date)}`
            : ""
      }
      actions={
        sale && !isLoading ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            {t("print.receipt")}
          </Button>
        ) : undefined
      }
    >
      {/* Print only the receipt content — hide the app chrome when printing. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      {isLoading ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Борлуулалтын мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Борлуулалтын мөрүүд</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </>
      ) : sale ? (
        <div className="print-area">
          {/* Sale header info */}
          <Card>
            <CardHeader>
              <CardTitle>Борлуулалтын мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Огноо</p>
                  <p className="font-medium">{formatDate(sale.sale_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Харилцагч</p>
                  <p className="font-medium">{contactName ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Борлуулагч</p>
                  <p className="font-medium">{salespersonName ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Статус</p>
                  <StatusBadge status={sale.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Төлбөрийн арга
                  </p>
                  <p className="font-medium">
                    {paymentMethodLabels[sale.payment_method ?? ""] ??
                      sale.payment_method ??
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Төлсөн дүн</p>
                  <p className="font-medium">
                    {formatCurrency(Number(sale.paid_amount ?? 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Нийт дүн</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(Number(sale.total_amount))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line items table */}
          <Card>
            <CardHeader>
              <CardTitle>Борлуулалтын мөрүүд</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-2 font-medium whitespace-nowrap">
                      Бараа
                    </th>
                    <th className="pb-2 text-right font-medium whitespace-nowrap">
                      Тоо хэмжээ
                    </th>
                    <th className="pb-2 text-right font-medium whitespace-nowrap">
                      Нэгж үнэ
                    </th>
                    <th className="pb-2 text-right font-medium whitespace-nowrap">
                      Нийт үнэ
                    </th>
                    <th className="pb-2 text-right font-medium whitespace-nowrap">
                      Комисс
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(items ?? []).map((item) => {
                    // Product join — guaranteed shape by .select("products(name, unit)")
                    const product = item.products as {
                      name: string;
                      unit: string | null;
                    } | null;
                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 font-medium whitespace-nowrap">
                          {product?.name ??
                            `Бүтээгдэхүүн #${(item.product_id ?? "").slice(0, 8)}`}
                        </td>
                        <td className="py-3 text-right tabular-nums whitespace-nowrap">
                          {item.quantity}
                          {product?.unit ? ` ${product.unit}` : ""}
                        </td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                          {formatCurrency(item.total_price)}
                        </td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                          {item.commission_amount
                            ? formatCurrency(item.commission_amount)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {(items ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        Борлуулалтын мөрүүд олдсонгүй
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Борлуулалт олдсонгүй
        </div>
      )}
    </PageShell>
  );
}
