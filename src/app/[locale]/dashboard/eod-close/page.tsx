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
  Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LowStockCard } from "@/app/[locale]/dashboard/_low-stock-card";
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
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useInventoryBalances,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface PaymentBreakdown {
  cash: number;
  card: number;
  bank_transfer: number;
  other: number;
}

interface IssueEntry {
  description: string;
  work_order_id: string;
  customer: string;
  days_open: number;
}

interface EodData {
  date: string;
  total_work_orders: number;
  total_revenue: number;
  open_work_orders: number;
  payment_breakdown: PaymentBreakdown;
  unpaid_invoices: { count: number; total: number };
  best_mechanic: {
    id: string;
    name: string;
    revenue: number;
    jobs: number;
  } | null;
  biggest_issue: IssueEntry | null;
}

interface DayCloseStatus {
  isClosed: boolean;
  streak: number;
}

// ── Helpers ────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Stat Card ──────────────────────────────────────────────

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
    <Card className="print:border-border print:shadow-none">
      <CardContent className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
          <Typography.Muted className="text-xs">{label}</Typography.Muted>
        </div>
        <Typography.H3 className="m-0 text-2xl font-bold tracking-tight">
          {value}
        </Typography.H3>
        {sub && <Typography.Muted className="text-xs">{sub}</Typography.Muted>}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

// ── Payment Method Mini Card ───────────────────────────────

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
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2">
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

// ── Loading Skeleton ───────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function EodClosePage() {
  const t = useTranslations();
  const { data: org, isPending: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;

  const [eodData, setEodData] = useState<EodData | null>(null);
  const [closeStatus, setCloseStatus] = useState<DayCloseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayStr();

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      const [eodRes, closeRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/reports?type=eod&date=${today}`),
        fetch(`/api/organizations/${orgId}/day-close?date=${today}`),
      ]);

      if (!eodRes.ok) {
        const eodErr = await eodRes.json().catch(() => ({}));
        throw new Error(eodErr.error ?? "Failed to load EOD data");
      }

      const eodJson = await eodRes.json();
      const closeJson = closeRes.ok
        ? await closeRes.json()
        : { data: { isClosed: false, streak: 0 } };

      setEodData(eodJson.data);
      setCloseStatus(closeJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [orgId, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCloseDay = useCallback(async () => {
    if (!orgId || closing) return;
    setClosing(true);

    try {
      const res = await fetch(`/api/organizations/${orgId}/day-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to close day");
      }

      const json = await res.json();
      setCloseStatus({ isClosed: true, streak: json.data.streak });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close day");
    } finally {
      setClosing(false);
    }
  }, [orgId, today, closing]);

  const handlePrint = () => {
    window.print();
  };

  // ── Low stock count for Pending Items ──────────────
  const { data: balances = [] } = useInventoryBalances(orgId);
  const { data: thresholds = [] } = useStockThresholds(orgId);

  const lowStockCount = useMemo(() => {
    if (!orgId) return 0;
    const thresholdMap = new Map<string, number>();
    for (const th of thresholds) {
      thresholdMap.set(th.part_id, th.minimum_quantity);
    }

    let count = 0;
    for (const b of balances) {
      const min = thresholdMap.get(b.part_id ?? "") ?? 5;
      const qty = b.quantity_on_hand ?? 0;
      if (qty <= 0 || qty < min) count++;
    }
    return count;
  }, [balances, thresholds, orgId]);

  // ── Loading state ──────────────────────────────────
  if (orgLoading || (loading && !eodData)) {
    return <PageSkeleton />;
  }

  if (error && !eodData) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <AlertTriangle className="size-10 text-destructive" />
        <Typography.H3 className="m-0">Failed to load data</Typography.H3>
        <Typography.Muted>{error}</Typography.Muted>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const eod = eodData;
  const close = closeStatus;
  const isClosed = close?.isClosed ?? false;
  const streak = close?.streak ?? 0;
  const openCount = eod?.open_work_orders ?? 0;
  const biggestIssue = eod?.biggest_issue ?? null;

  return (
    <div id="eod-report" className="flex flex-col gap-6 pb-8 print:gap-4">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            <Typography.H2 className="m-0 text-xl font-semibold">
              {t("eodClose.title") ?? "End of Day Summary"}
            </Typography.H2>
          </div>
          <Typography.Muted className="mt-1">
            {formatDate(today)}
          </Typography.Muted>
          {streak > 0 && (
            <div className="mt-1 flex items-center gap-1.5 print:hidden">
              <Trophy className="size-4 text-amber-500" />
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              >
                🔥 {streak}-day streak
              </Badge>
              <Typography.Muted className="text-[11px] text-muted-foreground/60 ml-1">
                {streak >= 5
                  ? "Amazing consistency!"
                  : streak >= 3
                    ? "Getting consistent!"
                    : "Keep it going!"}
              </Typography.Muted>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 size-3.5" />
            {t("eodClose.print") ?? "Print Report"}
          </Button>
          {!isClosed ? (
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleCloseDay}
              disabled={closing}
            >
              <CheckCircle2
                className={`mr-1.5 size-3.5 ${closing ? "animate-spin" : ""}`}
              />
              {closing
                ? "Closing..."
                : (t("eodClose.closeDay") ?? "Close Day ✓")}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <CheckCircle2 className="mr-1.5 size-3.5 text-emerald-500" />
              {t("eodClose.dayClosed") ?? "Day Closed ✓"}
            </Button>
          )}
        </div>
      </div>

      <Separator className="print:hidden" />

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          icon={DollarSign}
          label={t("eodClose.revenue") ?? "Total Revenue"}
          value={formatCurrency(eod?.total_revenue ?? 0)}
          accent="text-emerald-500"
        />
        <StatCard
          icon={CheckCircle2}
          label={t("eodClose.completedJobs") ?? "Completed Today"}
          value={String(eod?.total_work_orders ?? 0)}
          accent="text-blue-500"
        />
        <StatCard
          icon={Clock}
          label={t("eodClose.openJobs") ?? "Open Jobs"}
          value={String(eod?.open_work_orders ?? 0)}
          href="/dashboard/work-orders"
          accent={
            (eod?.open_work_orders ?? 0) > 0
              ? "text-amber-500"
              : "text-muted-foreground"
          }
        />
        <StatCard
          icon={Receipt}
          label={t("eodClose.unpaidInvoices") ?? "Unpaid Invoices"}
          value={`${eod?.unpaid_invoices?.count ?? 0} · ${formatCurrency(eod?.unpaid_invoices?.total ?? 0)}`}
          href="/dashboard/finance"
          accent={
            (eod?.unpaid_invoices?.count ?? 0) > 0
              ? "text-red-500"
              : "text-muted-foreground"
          }
        />
      </div>

      {/* ═══ Payment Breakdown ═══ */}
      {eod && (
        <Card className="print:border-border print:shadow-none">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Banknote className="size-4 text-muted-foreground" />
              <Typography.Text className="text-sm font-semibold">
                {t("eodClose.paymentBreakdown") ?? "Payment Breakdown"}
              </Typography.Text>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <PaymentMiniCard
                label={t("eodClose.cash") ?? "Cash"}
                amount={eod.payment_breakdown?.cash ?? 0}
                color="bg-emerald-500"
              />
              <PaymentMiniCard
                label={t("eodClose.card") ?? "Card"}
                amount={eod.payment_breakdown?.card ?? 0}
                color="bg-blue-500"
              />
              <PaymentMiniCard
                label={t("eodClose.bankTransfer") ?? "Bank Transfer"}
                amount={eod.payment_breakdown?.bank_transfer ?? 0}
                color="bg-purple-500"
              />
              <PaymentMiniCard
                label={t("eodClose.other") ?? "Other"}
                amount={eod.payment_breakdown?.other ?? 0}
                color="bg-gray-400"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Secondary Cards Grid ═══ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Best Mechanic */}
        <Card className="print:border-border print:shadow-none">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Crown className="size-4 text-amber-500" />
              <Typography.Text className="text-sm font-semibold">
                {t("eodClose.bestMechanic") ?? "Best Mechanic"}
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
                    {eod.best_mechanic.revenue
                      ? formatCurrency(eod.best_mechanic.revenue)
                      : "₮0"}{" "}
                    · {eod.best_mechanic.jobs} job
                    {eod.best_mechanic.jobs === 1 ? "" : "s"}
                  </Typography.Muted>
                </div>
              </div>
            ) : (
              <Typography.Muted className="text-sm">
                {t("eodClose.noMechanicData") ?? "No mechanic data today"}
              </Typography.Muted>
            )}
          </CardContent>
        </Card>

        {/* Biggest Issue */}
        <Card className="print:border-border print:shadow-none">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <Typography.Text className="text-sm font-semibold">
                {t("eodClose.biggestIssue") ?? "Biggest Issue"}
              </Typography.Text>
            </div>
            {openCount > 0 ? (
              <div>
                {biggestIssue && (
                  <>
                    <Typography.Text className="text-sm font-medium line-clamp-1">
                      {biggestIssue.description}
                    </Typography.Text>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {biggestIssue.days_open > 0
                          ? `${biggestIssue.days_open} day${biggestIssue.days_open === 1 ? "" : "s"} open`
                          : "Opened today"}
                      </span>
                      {biggestIssue.customer && (
                        <>
                          <span>·</span>
                          <span>{biggestIssue.customer}</span>
                        </>
                      )}
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
                      {t("eodClose.viewJob") ?? "View job →"}
                    </Button>
                  </>
                )}
                {openCount > 1 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    + {openCount - 1} more open work order
                    {openCount - 1 !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ) : (
              <Typography.Muted className="text-sm">
                {t("eodClose.noIssues") ?? "No outstanding issues 🎉"}
              </Typography.Muted>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Pending Items ═══ */}
      {orgId && lowStockCount > 0 && (
        <Collapsible defaultOpen className="print:hidden">
          <Card className="border-amber-200/50 bg-amber-50/30 print:border-border print:shadow-none dark:border-amber-800/30 dark:bg-amber-950/10">
            <CardContent className="p-4">
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <Typography.Text className="text-sm font-semibold">
                    {t("eodClose.pendingItems") ?? "Pending Items"}
                  </Typography.Text>
                  <Badge variant="secondary">{lowStockCount}</Badge>
                </div>
                <ChevronDown className="size-4 transition-transform data-[panel-open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent keepMounted className="mt-3">
                <LowStockCard orgId={orgId} />
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      )}

      {/* ═══ Footer ═══ */}
      <div className="print:mt-4 print:border-t print:border-border print:pt-4 print:text-center print:text-xs print:text-muted-foreground">
        {isClosed && (
          <Typography.Muted className="flex items-center gap-1.5 text-sm print:text-xs">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            {t("eodClose.dayClosedMessage") ??
              "Day closed — report captured for your records"}
            {streak > 0 && ` · ${streak}-day streak`}
          </Typography.Muted>
        )}
      </div>

      {/* ═══ Print Styles ═══ */}
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
  );
}
