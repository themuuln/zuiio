"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import type { BalanceSheetData, BalanceSheetRow } from "@/lib/reports";
import { createClient } from "@/lib/supabase/client";

function AccountSection({
  title,
  rows,
  total,
  variant,
}: {
  title: string;
  rows: BalanceSheetRow[];
  total: number;
  variant: "asset" | "liability" | "equity";
}) {
  const colors = {
    asset: "text-primary",
    liability: "text-destructive",
    equity: "text-chart-2",
  };

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
              <th className="px-3 py-2 text-right font-medium">Үлдэгдэл</th>
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
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))
            )}
            <tr className="border-t bg-muted/30 font-medium">
              <td colSpan={2} className="px-3 py-2">
                Нийт {title}
              </td>
              <td
                className={`px-3 py-2 text-right font-mono ${colors[variant]}`}
              >
                {formatCurrency(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BalanceSheet({ asOfDate }: { asOfDate: string }) {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["accounting", "balance-sheet", organizationId, asOfDate],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_balance_sheet", {
        p_organization_id: organizationId,
        p_as_of_date: asOfDate,
      });
      if (error) throw error;

      const rows = (data ?? []) as Array<{
        account_id: string;
        account_code: string;
        account_name: string;
        account_type: string;
        balance: number;
      }>;

      const mapRow = (r: (typeof rows)[number]): BalanceSheetRow => ({
        accountId: r.account_id,
        accountCode: r.account_code,
        accountName: r.account_name,
        accountType: r.account_type,
        balance: Number(r.balance),
      });

      const assets = rows.filter((r) => r.account_type === "asset").map(mapRow);
      const liabilities = rows
        .filter((r) => r.account_type === "liability")
        .map(mapRow);
      const equity = rows
        .filter((r) => r.account_type === "equity")
        .map(mapRow);

      return {
        assets,
        liabilities,
        equity,
        totalAssets: assets.reduce((sum, r) => sum + r.balance, 0),
        totalLiabilities: liabilities.reduce((sum, r) => sum + r.balance, 0),
        totalEquity: equity.reduce((sum, r) => sum + r.balance, 0),
      } satisfies BalanceSheetData;
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
  const isBalanced =
    data &&
    Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) <
      0.01;

  return (
    <div className="space-y-4">
      {/* Balance check */}
      {data && (
        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Нягтлан бодох тэнцээр</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Нийт хөрөнгө</p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(data.totalAssets)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Нийт өр төлбөр + өмч
                </p>
                <p className="text-lg font-semibold text-destructive">
                  {formatCurrency(data.totalLiabilities + data.totalEquity)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Төлөв</p>
                <p
                  className={`text-lg font-semibold ${isBalanced ? "text-chart-2" : "text-destructive"}`}
                >
                  {isBalanced ? "Тэнцүү" : "Тэнцээгүй"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail sections */}
      <AccountSection
        title="Хөрөнгө"
        rows={data?.assets ?? []}
        total={data?.totalAssets ?? 0}
        variant="asset"
      />
      <AccountSection
        title="Өр төлбөр"
        rows={data?.liabilities ?? []}
        total={data?.totalLiabilities ?? 0}
        variant="liability"
      />
      <AccountSection
        title="Өмч"
        rows={data?.equity ?? []}
        total={data?.totalEquity ?? 0}
        variant="equity"
      />
    </div>
  );
}
