"use client";

import { Building2, ClipboardList, Package, Plus, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useInventoryBalances,
  usePartsCatalog,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { QuickActions } from "@/components/sidebar-tabs/quick-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tab } from "./_components/constants";
import { getTabs } from "./_components/constants";
import { TableSkeleton } from "./_components/table-skeleton";
import { PartsTab } from "./_components/parts-tab";
import { MovementsTab } from "./_components/movements-tab";
import { SuppliersTab } from "./_components/suppliers-tab";
import { PurchaseOrdersTab } from "./_components/purchase-orders-tab";

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const { data: org, isLoading: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId ?? null;
  const { registerTab, setOpen } = useRightSidebar();
  const [tab, setTab] = useState<Tab>("parts");
  const [search, setSearch] = useState("");

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
    );

    setOpen(true);
  }, [parts, balanceMap, thresholdMap, registerTab, setOpen]);

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitleParts")}</p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => handleTabChange(tabItem.key)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors min-h-[48px] ${
                tab === tabItem.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4" />
              {tabItem.label}
            </button>
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
          parts={parts}
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
