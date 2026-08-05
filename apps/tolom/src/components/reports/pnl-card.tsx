/**
 * PnLCard — Simplified Profit & Loss statement.
 *
 * Shows: Revenue → COGS → Gross Profit → Expenses by category → Net Profit.
 */
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import type { PnLSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface PnLCardProps {
  data: PnLSummary | null;
  loading?: boolean;
}

interface PnLRow {
  label: string;
  amount: number;
  bold?: boolean;
  indent?: boolean;
  color?: string;
  isPercent?: boolean;
}

function buildRows(data: PnLSummary, t: (key: string) => string): PnLRow[] {
  // Reports without the full profitability payload (e.g. partial fixtures,
  // legacy rows) must not crash the P&L card.
  const revenue = data?.revenue ?? {};
  const cogs = data?.cogs ?? {};
  const rows: PnLRow[] = [
    {
      label: t("serviceRevenue"),
      amount: revenue.service_revenue ?? 0,
      indent: true,
    },
    {
      label: t("partsRevenue"),
      amount: revenue.parts_revenue ?? 0,
      indent: true,
    },
    { label: t("totalRevenue"), amount: revenue.total ?? 0, bold: true },
    { label: t("costOfGoodsSold"), amount: -(cogs.total ?? 0) },
    {
      label: t("grossProfit"),
      amount: data?.gross_profit ?? 0,
      bold: true,
      color:
        (data?.gross_profit ?? 0) >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-500",
    },
    {
      label: t("grossMargin"),
      amount: data?.gross_margin_pct ?? 0,
      isPercent: true,
      color: "text-muted-foreground",
    },
  ];

  for (const cat of (data?.expenses?.by_category ?? []).slice(0, 5)) {
    rows.push({
      label: `  ${cat.category}`,
      amount: -cat.amount,
      indent: true,
    });
  }

  rows.push({
    label: t("totalExpenses"),
    amount: -(data?.expenses?.total ?? 0),
  });
  rows.push({
    label: t("netProfit"),
    amount: data?.net_profit ?? 0,
    bold: true,
    color:
      (data?.net_profit ?? 0) >= 0
        ? "text-green-600 dark:text-green-400"
        : "text-red-500",
  });

  return rows;
}

export function PnLCard({ data, loading }: PnLCardProps) {
  const t = useTranslations("reports") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  if (loading) return <Skeleton className="h-[300px] rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          {t("profitAndLoss")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data ? (
          <Table>
            <TableBody>
              {buildRows(data, t).map((row, i) => (
                <TableRow
                  key={`${row.label}-${i}`}
                  className={row.bold ? "font-semibold" : ""}
                >
                  <TableCell
                    className={`px-4 py-1.5 text-xs ${row.indent ? "pl-8" : ""}`}
                  >
                    {row.label}
                  </TableCell>
                  <TableCell
                    className={`px-4 py-1.5 text-right text-xs tabular-nums ${row.color ?? ""}`}
                  >
                    {row.isPercent
                      ? `${row.amount.toFixed(1)}%`
                      : formatCurrency(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography.Muted className="py-8 text-center text-sm text-muted-foreground">
            {t("noDataForPeriod")}
          </Typography.Muted>
        )}
      </CardContent>
    </Card>
  );
}
