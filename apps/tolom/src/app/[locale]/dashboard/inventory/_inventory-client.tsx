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
import { ListPageShell } from "@/components/list-page-shell";
import { StatCard, StatCards } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
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
      <ListPageShell
        title={t("title")}
        description={t("subtitleParts")}
        loading={showSkeleton}
        headerAction={
          <Button
            render={<Link href="/dashboard/inventory/alerts" />}
            variant="outline"
            size="sm"
            nativeButton={false}
          >
            <AlertTriangle className="size-4" />
            Alerts
          </Button>
        }
      >
        {/* ── Reports KPI Cards ── */}
        <StatCards>
          <StatCard
            label={t("totalSKUs")}
            value={showSkeleton ? "—" : parts.length}
            icon={Package}
          />
          <StatCard
            label={t("totalStockValue")}
            value={
              showSkeleton
                ? "—"
                : formatMNT(
                    balances.reduce(
                      (sum, b) =>
                        sum +
                        (b.quantity_on_hand ?? 0) * (b.default_price ?? 0),
                      0,
                    ),
                  )
            }
            icon={BarChart3}
          />
          <StatCard
            label={t("turnoverRate")}
            value={
              showSkeleton
                ? "—"
                : turnover?.turnoverRate != null
                  ? `${turnover.turnoverRate.toFixed(1)}x`
                  : "—"
            }
            icon={TrendingDown}
          />
          <StatCard
            label={t("reports")}
            value={showSkeleton ? "—" : slowMoving.length}
            icon={Clock}
            sub={t("slowMovers")}
          />
        </StatCards>

        {/* Parts inventory - main view */}
        <PartsTab
          orgId={orgId ?? ""}
          branchFilter={branchFilter}
          search={search}
          onSearchChange={setSearch}
          onNavigate={handleTabChange}
        />
      </ListPageShell>
    </div>
  );
}

export { InventoryPage, InventoryPage as default };
