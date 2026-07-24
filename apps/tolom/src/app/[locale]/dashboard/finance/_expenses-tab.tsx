"use client";

import {
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import { useExpenseStats, useExpenses } from "@/lib/queries/use-expenses";
import { formatMNT } from "@/lib/utils";
import { KpiCard } from "./_kpi-card";

function ExpensesTab({ orgId }: { orgId: string | null }) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: expenses, isPending: expLoading } = useExpenses(
    orgId ?? undefined,
  );
  const { data: stats, isPending: statsLoading } = useExpenseStats(
    orgId ?? undefined,
  );
  const isPending = statsLoading || (expLoading && !expenses);
  const loading = isPending && !stats;

  const recentExpenses = (expenses ?? []).slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("expenses.totalExpenses")}
          value={loading ? "\u2014" : String(stats?.totalExpenses ?? 0)}
          icon={Wallet}
          loading={loading}
        />
        <KpiCard
          label={t("expenses.totalAmount")}
          value={loading ? "\u2014" : formatMNT(stats?.totalAmount ?? 0)}
          icon={DollarSign}
          loading={loading}
        />
        <KpiCard
          label={t("expenses.thisMonth")}
          value={loading ? "\u2014" : formatMNT(stats?.thisMonth ?? 0)}
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          label={t("expenses.unpaid")}
          value={loading ? "\u2014" : formatMNT(stats?.unpaidAmount ?? 0)}
          icon={Clock}
          subtitle={
            stats
              ? `${stats.unpaidAmount > 0 ? t("finance.percentOfTotal", { percent: ((stats.unpaidAmount / stats.totalAmount) * 100).toFixed(0) }) : t("finance.allPaid")}`
              : undefined
          }
          loading={loading}
        />
      </div>

      <div className="flex items-center justify-between">
        <Typography.Muted className="text-sm font-medium text-muted-foreground">
          {t("expenses.title")}
        </Typography.Muted>
        <Button
          render={<Link href="/dashboard/expenses" />}
          variant="outline"
          size="sm"
        >
          <ArrowRight className="size-4" />
          {t("common.viewAll")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5">
              <Skeleton className="h-8 w-full" />
            </div>
          ) : recentExpenses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wallet />
                </EmptyMedia>
                <EmptyTitle>{t("expenses.noExpenses")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  render={<Link href="/dashboard/expenses/new" />}
                  variant="outline"
                  size="sm"
                >
                  {t("expenses.addExpense")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                      {t("common.date")}
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                      {t("common.description")}
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                      {t("expenses.category")}
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                      {t("common.amount")}
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-center font-medium text-muted-foreground">
                      {t("common.status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.map((exp) => (
                    <TableRow
                      key={exp.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-3.5 text-muted-foreground">
                        {new Date(exp.expense_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 font-medium">
                        {exp.description}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        {exp.category ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${exp.category.color}20`,
                              color: exp.category.color,
                            }}
                          >
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: exp.category.color }}
                            />
                            {exp.category.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right font-medium tabular-nums">
                        {formatMNT(exp.amount)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-center">
                        {exp.paid_at ? (
                          <Badge variant="outline">{t("expenses.paid")}</Badge>
                        ) : (
                          <Badge variant="outline">
                            {t("expenses.unpaid")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { ExpensesTab };
