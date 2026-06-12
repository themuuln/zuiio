"use client";

import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Package,
  TrendingDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { Link } from "@/lib/i18n/navigation";
import {
  useInventoryBalances,
  useInventoryTurnover,
  usePartsCatalog,
  useSlowMovingStock,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import { PartsTab } from "./_components/parts-tab";
import { TableSkeleton } from "./_components/table-skeleton";

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const { data: org, isLoading: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId ?? null;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const { registerTab } = useRightSidebar();

  // Tab navigation removed - sidebar handles navigation
  // This stub is kept for PartsTab's onNavigate prop compatibility
  const handleTabChange = (_newTab: string) => {};
  const [search, setSearch] = useState("");

  // Data for sidebar + cross-tab coordination
  const { data: parts = [], error: partsError } = usePartsCatalog(
    orgId ?? undefined,
  );
  const { data: balances = [], error: balancesError } = useInventoryBalances(
    orgId ?? undefined,
    branchFilter,
  );
  const { data: thresholds = [], error: thresholdsError } = useStockThresholds(
    orgId ?? undefined,
    branchFilter,
  );
  const inventoryError = partsError || balancesError || thresholdsError;

  const { data: turnover } = useInventoryTurnover(
    orgId ?? undefined,
    branchFilter,
  );
  const { data: slowMoving = [] } = useSlowMovingStock(
    orgId ?? undefined,
    branchFilter,
  );

  // ── Sidebar: Stock Summary + Quick Actions ──────────
  const balanceMap = useMemo(() => {
    const map = new Map<string, (typeof balances)[number]>();
    for (const b of balances) {
      if (b.part_id) map.set(b.part_id, b);
    }
    return map;
  }, [balances]);

  const thresholdMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of thresholds) {
      map[t.part_id] = t.minimum_quantity;
    }
    return map;
  }, [thresholds]);

  useEffect(() => {
    if (parts.length === 0) return;

    const totalParts = parts.filter((p) => p.is_active).length;
    let lowStock = 0;
    let outOfStock = 0;

    for (const p of parts) {
      if (!p.is_active) continue;
      const bal = balanceMap.get(p.id);
      const qty = bal?.quantity_on_hand ?? 0;
      const min = thresholdMap[p.id] ?? 5;
      if (qty <= 0) outOfStock++;
      else if (qty < min) lowStock++;
    }

    registerTab(
      "stock",
      "Stock",
      <StatusSummary
        items={[
          { label: "Total SKUs", count: totalParts },
          { label: "Low Stock", count: lowStock, color: "secondary" },
          { label: "Out of Stock", count: outOfStock, color: "destructive" },
        ]}
      />,
      <Package className="size-4" />,
    );
  }, [parts, balanceMap, thresholdMap, registerTab]);

  // ── Loading state ──────────────────────────────────
  if (orgLoading && !orgId) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <TableSkeleton />
      </div>
    );
  }

  if (inventoryError && !parts.length && !balances.length) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </Typography.H1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="size-10 text-muted-foreground/40" />
          <Typography.Muted className="text-muted-foreground text-center">
            Couldn&apos;t load inventory data.
          </Typography.Muted>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!orgId) return null;

  return (
    <div className="tablet-touch flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("subtitleParts")}
          </Typography.Muted>
        </div>
        <Button
          render={<Link href="/dashboard/inventory/alerts" />}
          variant="outline"
          size="sm"
        >
          <AlertTriangle className="size-4" />
          Alerts
        </Button>
      </div>

      {/* ── Reports KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="flex flex-col gap-1 p-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Package className="size-3" />
              {t("totalSKUs")}
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {parts.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="size-3" />
              {t("totalStockValue")}
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {balances
                .reduce(
                  (sum, b) =>
                    sum + (b.quantity_on_hand ?? 0) * (b.default_price ?? 0),
                  0,
                )
                .toLocaleString()}{" "}
              ₮
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="size-3" />
              {t("turnoverRate")}
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {turnover?.turnoverRate != null
                ? `${turnover.turnoverRate.toFixed(1)}x`
                : "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {t("reports")}
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {slowMoving.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("slowMovers")}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Parts inventory - main view */}
      <PartsTab
        orgId={orgId}
        branchFilter={branchFilter}
        search={search}
        onSearchChange={setSearch}
        onNavigate={handleTabChange}
      />
    </div>
  );
}
