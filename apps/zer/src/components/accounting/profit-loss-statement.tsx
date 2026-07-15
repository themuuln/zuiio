"use client";

import { TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import type { ProfitLossData, ProfitLossRow } from "@/lib/reports";
import { createClient } from "@/lib/supabase/client";

function SectionTable({
  title,
  rows,
  total,
  totalLabel,
}: {
  title: string;
  rows: ProfitLossRow[];
  total: number;
  totalLabel: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Код</th>
              <th className="px-3 py-2 text-left font-medium">Нэр</th>
              <th className="px-3 py-2 text-right font-medium">Дүн</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-muted-foreground"
                >
                  Мэдээлэл байхгүй
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.accountId} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {row.accountCode}
                  </td>
                  <td className="px-3 py-2">{row.accountName}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrency(row.amount)}
                  </td>
                </tr>
              ))
            )}
            <tr className="border-t bg-muted/30 font-medium">
              <td colSpan={2} className="px-3 py-2">
                {totalLabel}
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {formatCurrency(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProfitLossStatement({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["accounting", "profit-loss", organizationId, dateFrom, dateTo],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_profit_loss", {
        p_organization_id: organizationId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });
      if (error) throw error;

      const rows = (data ?? []) as Array<{
        account_id: string;
        account_code: string;
        account_name: string;
        account_type: string;
        amount: number;
      }>;

      const revenue = rows
        .filter((r) => r.account_type === "income")
        .map((r) => ({
          accountId: r.account_id,
          accountCode: r.account_code,
          accountName: r.account_name,
          accountType: r.account_type,
          amount: Number(r.amount),
        }));

      const expenses = rows
        .filter((r) => r.account_type === "expense")
        .map((r) => ({
          accountId: r.account_id,
          accountCode: r.account_code,
          accountName: r.account_name,
          accountType: r.account_type,
          amount: Number(r.amount),
        }));

      const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
      const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0);

      return {
        revenue,
        expenses,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
      } satisfies ProfitLossData;
    },
    enabled: !!organizationId,
  });

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Нийт орлого</CardTitle>
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <TrendUp />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-primary">
              {formatCurrency(data?.totalRevenue ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Нийт зарлага</CardTitle>
            <div className="rounded-2xl bg-destructive/10 p-2 text-destructive">
              <TrendDown />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              {formatCurrency(data?.totalExpenses ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Цэвэр ашиг</CardTitle>
            <div
              className={`rounded-2xl p-2 ${(data?.netIncome ?? 0) >= 0 ? "bg-chart-2/12 text-chart-2" : "bg-destructive/10 text-destructive"}`}
            >
              {(data?.netIncome ?? 0) >= 0 ? <TrendUp /> : <TrendDown />}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-semibold ${(data?.netIncome ?? 0) >= 0 ? "text-chart-2" : "text-destructive"}`}
            >
              {formatCurrency(data?.netIncome ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail tables */}
      <SectionTable
        title="Орлого"
        rows={data?.revenue ?? []}
        total={data?.totalRevenue ?? 0}
        totalLabel="Нийт орлого"
      />
      <SectionTable
        title="Зарлага"
        rows={data?.expenses ?? []}
        total={data?.totalExpenses ?? 0}
        totalLabel="Нийт зарлага"
      />
    </div>
  );
}
