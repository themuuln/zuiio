/**
 * PnLCard — Simplified Profit & Loss statement.
 *
 * Shows: Revenue → COGS → Gross Profit → Expenses by category → Net Profit.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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

function buildRows(data: PnLSummary): PnLRow[] {
  const rows: PnLRow[] = [
    {
      label: "Service Revenue",
      amount: data.revenue.service_revenue,
      indent: true,
    },
    {
      label: "Parts Revenue",
      amount: data.revenue.parts_revenue,
      indent: true,
    },
    { label: "Total Revenue", amount: data.revenue.total, bold: true },
    { label: "Cost of Goods Sold", amount: -data.cogs.total },
    {
      label: "Gross Profit",
      amount: data.gross_profit,
      bold: true,
      color:
        data.gross_profit >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-500",
    },
    {
      label: "Gross Margin",
      amount: data.gross_margin_pct,
      isPercent: true,
      color: "text-muted-foreground",
    },
  ];

  for (const cat of data.expenses.by_category.slice(0, 5)) {
    rows.push({
      label: `  ${cat.category}`,
      amount: -cat.amount,
      indent: true,
    });
  }

  rows.push({ label: "Total Expenses", amount: -data.expenses.total });
  rows.push({
    label: "Net Profit",
    amount: data.net_profit,
    bold: true,
    color:
      data.net_profit >= 0
        ? "text-green-600 dark:text-green-400"
        : "text-red-500",
  });

  return rows;
}

export function PnLCard({ data, loading }: PnLCardProps) {
  if (loading) return <Skeleton className="h-[300px] rounded-xl" />;
  if (!data) return null;

  const rows = buildRows(data);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Profit & Loss</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableBody>
            {rows.map((row, i) => (
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
      </CardContent>
    </Card>
  );
}
