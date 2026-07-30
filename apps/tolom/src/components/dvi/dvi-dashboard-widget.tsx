"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDVInspections } from "@/lib/queries/use-dvi";
import { useCurrentOrg } from "@/lib/queries/use-organization";

// ── Helpers ──────────────────────────────────────────────────

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ── Stat card ─────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  loading?: boolean;
}

function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <Card className="flex-1 min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-xl font-semibold tabular-nums">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Dashboard widget ─────────────────────────────────────────

export function DviDashboardWidget() {
  const t = useTranslations("dvi");
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;

  const { data: inspections, isPending } = useDVInspections(orgId);

  const stats = useMemo(() => {
    if (!inspections)
      return { pending: 0, approvedToday: 0, conversionRate: 0 };

    const pending = inspections.filter(
      (i) => i.status === "draft" || i.status === "ready",
    ).length;

    const approvedToday = inspections.filter(
      (i) => i.status === "approved" && i.updated_at && isToday(i.updated_at),
    ).length;

    const sent = inspections.filter(
      (i) =>
        i.status === "sent" ||
        i.status === "partially_approved" ||
        i.status === "approved" ||
        i.status === "declined",
    ).length;

    const approved = inspections.filter(
      (i) => i.status === "approved" || i.status === "partially_approved",
    ).length;

    const conversionRate = sent > 0 ? Math.round((approved / sent) * 100) : 0;

    return { pending, approvedToday, conversionRate };
  }, [inspections]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <StatCard
            label={t("status.draft")}
            value={stats.pending}
            loading={isPending}
          />
          <StatCard
            label={t("status.approved")}
            value={stats.approvedToday}
            loading={isPending}
          />
          <StatCard
            label="Conversion Rate"
            value={`${stats.conversionRate}%`}
            loading={isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
