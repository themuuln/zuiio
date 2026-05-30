"use client";

import { AlertTriangle, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useInventoryBalances,
  usePartsCatalog,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tab } from "./_components/constants";
import { getTabs } from "./_components/constants";
import { TableSkeleton } from "./_components/table-skeleton";
import { PartsTab } from "./_components/parts-tab";
import { MovementsTab } from "./_components/movements-tab";
import { SuppliersTab } from "./_components/suppliers-tab";
import { PurchaseOrdersTab } from "./_components/purchase-orders-tab";
import { Typography } from "@/components/ui/typography";

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const { data: org, isLoading: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId ?? null;
  const { registerTab } = useRightSidebar();
  const [tab, setTab] = useState<Tab>("parts");
  const [search, setSearch] = useState("");
  const [movementFilter, setMovementFilter] = useState("all");

  // Data for sidebar + cross-tab coordination
  const { data: parts = [] } = usePartsCatalog(orgId ?? undefined);
  const { data: balances = [] } = useInventoryBalances(orgId ?? undefined);
  const { data: thresholds = [] } = useStockThresholds(orgId ?? undefined);

  const handleTabChange = useCallback((newTab: string) => {
    setTab(newTab as Tab);
    setSearch("");
  }, []);

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

  if (!orgId) return null;

  const tabs = getTabs(t);

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

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          return (
            <Button
              key={tabItem.key}
              variant={tab === tabItem.key ? "default" : "ghost"}
              onClick={() => handleTabChange(tabItem.key)}
              className="gap-2"
            >
              <Icon className="size-4" />
              {tabItem.label}
            </Button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "parts" && (
        <PartsTab
          orgId={orgId}
          search={search}
          onSearchChange={setSearch}
          onNavigate={handleTabChange}
        />
      )}
      {tab === "movements" && (
        <MovementsTab
          orgId={orgId}
          search={search}
          onSearchChange={setSearch}
          movementFilter={movementFilter}
          onMovementFilterChange={setMovementFilter}
        />
      )}
      {tab === "suppliers" && (
        <SuppliersTab
          orgId={orgId}
          search={search}
          onSearchChange={setSearch}
        />
      )}
      {tab === "purchase-orders" && (
        <PurchaseOrdersTab
          orgId={orgId}
          search={search}
          onSearchChange={setSearch}
        />
      )}
    </div>
  );
}
