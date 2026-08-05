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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useIsFirstLoad } from "@/hooks/use-is-first-load";
import { Link } from "@/lib/i18n/navigation";
import {
  useInventoryBalances,
  useInventoryTurnover,
  usePartsCatalog,
  useSlowMovingStock,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import { formatMNT } from "@/lib/utils";
import { PartsTab } from "./_components/parts-tab";

function InventoryPage() {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: org, isPending: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId ?? null;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  // Tab navigation removed - sidebar handles navigation
  // This stub is kept for PartsTab's onNavigate prop compatibility
  const handleTabChange = (_newTab: string) => {};
  const [search, setSearch] = useState("");

  // Prefill search from ?q= (e.g. global search jump target). Read once on mount
  // via window.location so we avoid useSearchParams Suspense requirements.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  // Data for sidebar + cross-tab coordination
  const { data: parts = [], error: partsError } = usePartsCatalog(
    orgId ?? undefined,
  );
  const { data: balances = [], error: balancesError } = useInventoryBalances(
    orgId ?? undefined,
    branchFilter,
  );
  const inventoryError = partsError || balancesError;

  const { data: turnover } = useInventoryTurnover(
    orgId ?? undefined,
    branchFilter,
  );
  const { data: slowMoving = [] } = useSlowMovingStock(
    orgId ?? undefined,
    branchFilter,
  );

  const isFirstLoad = useIsFirstLoad(!!orgId);

  const showSkeleton = (orgLoading && !orgId) || isFirstLoad;

  return (
    <div className="tablet-touch flex flex-col gap-6">
      {inventoryError && !showSkeleton && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <AlertCircle className="size-4 text-destructive" />
          <span className="text-sm text-destructive">
            Couldn&apos;t load inventory data.
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {showSkeleton ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <Typography.H1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </Typography.H1>
          )}
          {showSkeleton ? (
            <Skeleton className="h-4 w-64" />
          ) : (
            <Typography.Muted className="text-muted-foreground">
              {t("subtitleParts")}
            </Typography.Muted>
          )}
        </div>
        <Button
          render={<Link href="/dashboard/inventory/alerts" />}
          variant="outline"
          size="sm"
          nativeButton={false}
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
              {showSkeleton ? "—" : parts.length}
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
              {showSkeleton
                ? "—"
                : formatMNT(
                    balances.reduce(
                      (sum, b) =>
                        sum +
                        (b.quantity_on_hand ?? 0) * (b.default_price ?? 0),
                      0,
                    ),
                  )}
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
              {showSkeleton
                ? "—"
                : turnover?.turnoverRate != null
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
              {showSkeleton ? "—" : slowMoving.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("slowMovers")}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Parts inventory - main view */}
      <PartsTab
        orgId={orgId ?? ""}
        branchFilter={branchFilter}
        search={search}
        onSearchChange={setSearch}
        onNavigate={handleTabChange}
      />
    </div>
  );
}

export { InventoryPage, InventoryPage as default };
