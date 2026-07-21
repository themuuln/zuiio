"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Crown,
  DollarSign,
  Printer,
  Receipt,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LowStockCard } from "@/app/[locale]/dashboard/_low-stock-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import { useBranches } from "@/lib/queries/use-branches";
import { useCurrentSession } from "@/lib/queries/use-cash-register";
import {
  useCloseDay,
  useDayCloseStatus,
  useEodReport,
} from "@/lib/queries/use-day-close";
import {
  useInventoryBalances,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";
import { useSelectedBranchId } from "@/lib/stores";
import type { EndOfDaySummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <Card
      className={`transition-shadow print:border-border print:shadow-none ${
        href ? "hover:shadow-sm" : ""
      }`}
    >
      <CardContent className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
          <Typography.Muted className="text-xs">{label}</Typography.Muted>
        </div>
        <Typography.H3 className="m-0 text-2xl font-semibold tracking-tight">
          {value}
        </Typography.H3>
        {sub ? (
          <Typography.Muted className="text-xs">{sub}</Typography.Muted>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return inner;
}

function PaymentMiniCard({
  label,
  amount,
  color,
}: {
  label: string;
  amount: number;
  color: string;
}) {
  return (
    <div className="flex min-h-[44px] items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={`size-2.5 rounded-full ${color}`} />
        <Typography.Text className="text-sm">{label}</Typography.Text>
      </div>
      <Typography.Text className="text-sm font-semibold tabular-nums">
        {formatCurrency(amount)}
      </Typography.Text>
    </div>
  );
}

export default function EodClosePage() {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const locale = useLocale();
  const localeTag = locale === "mn" ? "mn-MN" : "en-US";
  const { data: org, isPending: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const today = todayStr();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPendingItemsOpen, setIsPendingItemsOpen] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const { data: branches = [] } = useBranches(orgId);
  const branchName = branchFilter
    ? (branches.find((branch) => branch.id === branchFilter)?.name ??
      t("common.unknown"))
    : t("dashboard.allBranches");

  const eodQuery = useEodReport(orgId, today, branchFilter);
  const statusQuery = useDayCloseStatus(orgId, today);
  const closeDayMutation = useCloseDay(orgId, today, branchFilter);
  const { data: cashSession } = useCurrentSession(orgId, branchFilter);

  const { data: balances = [] } = useInventoryBalances(orgId, branchFilter);
  const { data: thresholds = [] } = useStockThresholds(orgId, branchFilter);

  const lowStockCount = useMemo(() => {
    if (!orgId) return 0;

    const thresholdMap = new Map<string, number>();
    for (const threshold of thresholds) {
      thresholdMap.set(threshold.part_id, threshold.minimum_quantity);
    }

    let count = 0;
    for (const balance of balances) {
      const min = thresholdMap.get(balance.part_id ?? "") ?? 5;
      const qty = balance.quantity_on_hand ?? 0;
      if (qty <= 0 || qty < min) count += 1;
    }

    return count;
  }, [balances, thresholds, orgId]);

  const eod = (eodQuery.data ?? null) as EndOfDaySummary | null;
  const closeStatus = statusQuery.data ?? null;
  const isClosed = closeStatus?.isClosed ?? false;
  const streak = closeStatus?.streak ?? 0;
  const openCount = eod?.open_work_orders ?? 0;
  const biggestIssue = eod?.biggest_issue ?? null;
  const unpaidInvoiceCount = eod?.unpaid_invoices?.count ?? 0;

  const attentionItems = [
    {
      id: "open-jobs",
      active: openCount > 0,
      label: `${openCount} ${t("eodClose.openJobs")}`,
    },
    {
      id: "unpaid-invoices",
      active: unpaidInvoiceCount > 0,
      label: `${unpaidInvoiceCount} ${t("eodClose.unpaidInvoices")}`,
    },
    {
      id: "low-stock",
      active: lowStockCount > 0,
      label: `${lowStockCount} ${t("inventory.lowStockItems")}`,
    },
  ].filter((item) => item.active);

  const isPending = orgLoading || (eodQuery.isPending && !eod);
  const fullPageError =
    !eod && (eodQuery.error?.message ?? statusQuery.error?.message);
  const inlineError = eod
    ? (eodQuery.error?.message ?? statusQuery.error?.message)
    : null;
  const isRefreshing = eodQuery.isFetching || statusQuery.isFetching;

  useEffect(() => {
    if (eod && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [eod, hasLoadedOnce]);

  const handleRefresh = async () => {
    await Promise.all([eodQuery.refetch(), statusQuery.refetch()]);
  };

  const handleConfirmClose = async () => {
    try {
      const result = await closeDayMutation.mutateAsync();
      const queued =
        typeof result === "object" &&
        result !== null &&
        "queued" in result &&
        Boolean((result as Record<string, unknown>).queued);

      if (!queued) {
        toast.success(t("eodClose.toastCloseDaySuccess"));
      }

      setIsConfirmOpen(false);
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error(t("eodClose.toastCloseDayError"));
    }
  };

  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      {fullPageError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertTriangle className="size-4 text-destructive" />
          <span className="text-sm text-destructive">{fullPageError}</span>
          <Button onClick={handleRefresh}>{t("common.retry")}</Button>
        </div>
      )}
      <div
        id="eod-report"
        className="tablet-touch flex flex-col gap-6 pb-8 print:gap-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {isPending ? (
            <div className="flex flex-col gap-2">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-5 text-primary" />
                  <Typography.H2 className="m-0 text-xl font-semibold">
                    {t("eodClose.title")}
                  </Typography.H2>
                </div>
                <Typography.Muted className="mt-1">
                  {formatDate(today, localeTag)}
                </Typography.Muted>
              </div>

              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Badge variant="outline" className="gap-1.5">
                  <span className="text-muted-foreground">
                    {t("reports.branch")}:
                  </span>
                  <span>{branchName}</span>
                </Badge>
                <Badge variant={isClosed ? "secondary" : "outline"}>
                  {isClosed
                    ? t("eodClose.closedStatus")
                    : t("eodClose.openStatus")}
                </Badge>
                {streak > 0 ? (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    <Trophy className="size-3.5" />
                    {t("eodClose.streak", { count: streak })}
                  </Badge>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`mr-1.5 size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {t("common.refresh")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 size-3.5" />
              {t("eodClose.print")}
            </Button>
            {!isClosed ? (
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setIsConfirmOpen(true)}
                disabled={closeDayMutation.isPending}
              >
                <CheckCircle2
                  className={`mr-1.5 size-3.5 ${closeDayMutation.isPending ? "animate-spin" : ""}`}
                />
                {closeDayMutation.isPending
                  ? t("common.saving")
                  : t("eodClose.closeDay")}
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                <CheckCircle2 className="mr-1.5 size-3.5 text-emerald-500" />
                {t("eodClose.dayClosed")}
              </Button>
            )}
          </div>
        </div>

        <Alert
          className={
            isClosed
              ? "border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10"
              : attentionItems.length > 0
                ? "border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10"
                : "border-blue-200/50 bg-blue-50/30 dark:border-blue-800/30 dark:bg-blue-950/10"
          }
        >
          <AlertTitle>
            {isClosed
              ? t("eodClose.closedStatus")
              : attentionItems.length > 0
                ? t("eodClose.reviewBeforeClose")
                : t("eodClose.readyToClose")}
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {attentionItems.length > 0 ? (
                attentionItems.map((item) => (
                  <Badge
                    key={item.id}
                    variant="outline"
                    className="bg-background/70"
                  >
                    {item.label}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="bg-background/70">
                  {t("eodClose.noPendingItems")}
                </Badge>
              )}
            </div>
            <Typography.Muted className="text-xs">
              {isClosed ? t("eodClose.printHint") : t("eodClose.closeHint")}
            </Typography.Muted>
          </AlertDescription>
        </Alert>

        {inlineError ? (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertTitle>{t("eodClose.failedToLoad")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{inlineError}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                {t("common.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Separator className="print:hidden" />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            icon={DollarSign}
            label={t("eodClose.revenue")}
            value={formatCurrency(eod?.total_revenue ?? 0)}
            accent="text-emerald-500"
          />
          <StatCard
            icon={CheckCircle2}
            label={t("eodClose.completedJobs")}
            value={String(eod?.total_work_orders ?? 0)}
            sub={formatCurrency(
              (eod?.total_revenue ?? 0) /
                Math.max(eod?.total_work_orders ?? 0, 1),
            )}
            accent="text-blue-500"
          />
          <StatCard
            icon={Clock}
            label={t("eodClose.openJobs")}
            value={String(openCount)}
            sub={
              attentionItems.length > 0
                ? t("eodClose.reviewBeforeClose")
                : undefined
            }
            href="/dashboard/work-orders"
            accent={openCount > 0 ? "text-amber-500" : "text-muted-foreground"}
          />
          <StatCard
            icon={Receipt}
            label={t("eodClose.unpaidInvoices")}
            value={`${unpaidInvoiceCount} · ${formatCurrency(eod?.unpaid_invoices?.total ?? 0)}`}
            sub={
              lowStockCount > 0
                ? `${lowStockCount} ${t("inventory.lowStockItems")}`
                : undefined
            }
            href="/dashboard/finance"
            accent={
              unpaidInvoiceCount > 0 ? "text-red-500" : "text-muted-foreground"
            }
          />
        </div>

        {/* Cash Register Status */}
        <Card className="print:border-border print:shadow-none">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-8 items-center justify-center rounded-full ${
                  cashSession
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-muted"
                }`}
              >
                <Banknote
                  className={`size-4 ${
                    cashSession
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <Typography.Text className="text-sm font-semibold">
                  {t("cashRegister.title")}
                </Typography.Text>
                <Typography.Muted className="text-xs">
                  {cashSession
                    ? `${t("cashRegister.sessionOpen")} · ${formatCurrency(cashSession.opening_balance)}`
                    : t("cashRegister.noSession")}
                </Typography.Muted>
              </div>
            </div>
            <Link
              href="/dashboard/cash-register"
              className="text-xs text-primary hover:underline"
            >
              {cashSession
                ? t("cashRegister.closeSession")
                : t("cashRegister.openSession")}
              →
            </Link>
          </CardContent>
        </Card>

        {eod ? (
          <Card className="print:border-border print:shadow-none">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Banknote className="size-4 text-muted-foreground" />
                <Typography.Text className="text-sm font-semibold">
                  {t("eodClose.paymentBreakdown")}
                </Typography.Text>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <PaymentMiniCard
                  label={t("eodClose.cash")}
                  amount={eod.payment_breakdown?.cash ?? 0}
                  color="bg-emerald-500"
                />
                <PaymentMiniCard
                  label={t("eodClose.card")}
                  amount={eod.payment_breakdown?.card ?? 0}
                  color="bg-blue-500"
                />
                <PaymentMiniCard
                  label={t("eodClose.bankTransfer")}
                  amount={eod.payment_breakdown?.bank_transfer ?? 0}
                  color="bg-purple-500"
                />
                <PaymentMiniCard
                  label={t("eodClose.other")}
                  amount={eod.payment_breakdown?.other ?? 0}
                  color="bg-gray-400"
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="print:border-border print:shadow-none">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Crown className="size-4 text-amber-500" />
                <Typography.Text className="text-sm font-semibold">
                  {t("eodClose.bestMechanic")}
                </Typography.Text>
              </div>
              {eod?.best_mechanic ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Trophy className="size-5" />
                  </div>
                  <div className="flex-1">
                    <Typography.Text className="font-medium">
                      {eod.best_mechanic.name}
                    </Typography.Text>
                    <Typography.Muted className="text-xs">
                      {formatCurrency(eod.best_mechanic.revenue)} ·{" "}
                      {t("reports.jobs")}: {eod.best_mechanic.jobs}
                    </Typography.Muted>
                  </div>
                </div>
              ) : (
                <Typography.Muted className="text-sm">
                  {t("eodClose.noMechanicData")}
                </Typography.Muted>
              )}
            </CardContent>
          </Card>

          <Card className="print:border-border print:shadow-none">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <Typography.Text className="text-sm font-semibold">
                  {t("eodClose.biggestIssue")}
                </Typography.Text>
              </div>
              {openCount > 0 ? (
                <div>
                  {biggestIssue ? (
                    <>
                      <Typography.Text className="line-clamp-1 text-sm font-medium">
                        {biggestIssue.description}
                      </Typography.Text>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {biggestIssue.days_open > 0
                            ? t("eodClose.daysOpen", {
                                count: biggestIssue.days_open,
                              })
                            : t("eodClose.openedToday")}
                        </span>
                        {biggestIssue.customer ? (
                          <>
                            <span>·</span>
                            <span>{biggestIssue.customer}</span>
                          </>
                        ) : null}
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0 text-xs"
                        render={
                          <Link
                            href={`/dashboard/work-orders/${biggestIssue.work_order_id}`}
                          />
                        }
                      >
                        {t("eodClose.viewJob")}
                      </Button>
                    </>
                  ) : null}
                  {openCount > 1 ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {t("eodClose.moreOpenWorkOrders", {
                        count: openCount - 1,
                      })}
                    </div>
                  ) : null}
                </div>
              ) : (
                <Typography.Muted className="text-sm">
                  {t("eodClose.noIssues")}
                </Typography.Muted>
              )}
            </CardContent>
          </Card>
        </div>

        {orgId && lowStockCount > 0 ? (
          <Collapsible
            open={isPendingItemsOpen}
            onOpenChange={setIsPendingItemsOpen}
            className="print:hidden"
          >
            <Card className="border-amber-200/50 bg-amber-50/30 print:border-border print:shadow-none dark:border-amber-800/30 dark:bg-amber-950/10">
              <CardContent className="p-4">
                <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md text-left">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <Typography.Text className="text-sm font-semibold">
                      {t("eodClose.pendingItems")}
                    </Typography.Text>
                    <Badge variant="secondary">{lowStockCount}</Badge>
                  </div>
                  <ChevronDown
                    className={`size-4 transition-transform ${
                      isPendingItemsOpen ? "rotate-180" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent keepMounted className="mt-3">
                  <LowStockCard orgId={orgId} />
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        ) : null}

        <div className="print:mt-4 print:border-t print:border-border print:pt-4 print:text-center print:text-xs print:text-muted-foreground">
          {isClosed ? (
            <Typography.Muted className="flex items-center gap-1.5 text-sm print:text-xs">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              {t("eodClose.dayClosedMessage")}
              {streak > 0
                ? ` · ${t("eodClose.streak", { count: streak })}`
                : ""}
            </Typography.Muted>
          ) : null}
        </div>

        <style jsx>{`
          @media print {
            .print\\:hidden {
              display: none !important;
            }
            .print\\:border-border {
              border-color: hsl(var(--border));
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:gap-4 {
              gap: 1rem;
            }
            .print\\:mt-4 {
              margin-top: 1rem;
            }
            .print\\:border-t {
              border-top-width: 1px;
            }
            .print\\:pt-4 {
              padding-top: 1rem;
            }
            .print\\:text-center {
              text-align: center;
            }
            .print\\:text-xs {
              font-size: 0.75rem;
              line-height: 1rem;
            }
          }
        `}</style>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("eodClose.closeConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("eodClose.closeConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("eodClose.openJobs")}
              </span>
              <span className="font-medium tabular-nums">{openCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("eodClose.unpaidInvoices")}
              </span>
              <span className="font-medium tabular-nums">
                {unpaidInvoiceCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("inventory.lowStockItems")}
              </span>
              <span className="font-medium tabular-nums">{lowStockCount}</span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {closeDayMutation.isPending
                ? t("common.saving")
                : t("eodClose.closeDay")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
