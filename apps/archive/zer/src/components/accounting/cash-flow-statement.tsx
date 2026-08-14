"use client";

import {
  ArrowDown,
  ArrowUp,
  Bank,
  CurrencyDollar,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import type { CashFlowData } from "@/lib/reports";
import { createClient } from "@/lib/supabase/client";

const CATEGORY_LABELS: Record<string, string> = {
  operating: "Ажиллагааны",
  investing: "Хөрөнгө оруулалтын",
  financing: "Санхүүжилтийн",
};

const CATEGORY_ICONS: Record<string, typeof CurrencyDollar> = {
  operating: CurrencyDollar,
  investing: Bank,
  financing: TrendUp,
};

export function CashFlowStatement({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["accounting", "cash-flow", organizationId, dateFrom, dateTo],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_cash_flow", {
        p_organization_id: organizationId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });
      if (error) throw error;

      const rows = (data ?? []) as Array<{
        category: string;
        amount: number;
      }>;

      const operating =
        rows.find((r) => r.category === "operating")?.amount ?? 0;
      const investing =
        rows.find((r) => r.category === "investing")?.amount ?? 0;
      const financing =
        rows.find((r) => r.category === "financing")?.amount ?? 0;

      return {
        operating: Number(operating),
        investing: Number(investing),
        financing: Number(financing),
        netCashFlow: Number(operating) + Number(investing) + Number(financing),
      } satisfies CashFlowData;
    },
    enabled: !!organizationId,
  });

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const data = query.data;
  const categories = ["operating", "investing", "financing"] as const;

  return (
    <div className="space-y-4">
      {/* Net cash flow summary */}
      <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Цэвэр мөнгөн урсгал</CardTitle>
          <div
            className={`rounded-2xl p-2 ${(data?.netCashFlow ?? 0) >= 0 ? "bg-chart-2/12 text-chart-2" : "bg-destructive/10 text-destructive"}`}
          >
            {(data?.netCashFlow ?? 0) >= 0 ? <ArrowUp /> : <ArrowDown />}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-semibold ${(data?.netCashFlow ?? 0) >= 0 ? "text-chart-2" : "text-destructive"}`}
          >
            {formatCurrency(data?.netCashFlow ?? 0)}
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Төрөл</th>
              <th className="px-3 py-2 text-right font-medium">Дүн</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const amount = data?.[cat] ?? 0;
              const Icon = CATEGORY_ICONS[cat];
              return (
                <tr key={cat} className="border-b last:border-b-0">
                  <td className="flex items-center gap-2 px-3 py-2.5">
                    <Icon className="size-4 text-muted-foreground" />
                    {CATEGORY_LABELS[cat]} мөнгөн урсгал
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono ${amount >= 0 ? "text-chart-2" : "text-destructive"}`}
                  >
                    {formatCurrency(amount)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t bg-muted/30 font-medium">
              <td className="px-3 py-2">Нийт мөнгөн урсгал</td>
              <td
                className={`px-3 py-2 text-right font-mono ${(data?.netCashFlow ?? 0) >= 0 ? "text-chart-2" : "text-destructive"}`}
              >
                {formatCurrency(data?.netCashFlow ?? 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
