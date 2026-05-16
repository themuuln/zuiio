"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExportColumn } from "@/lib/export";
import { useInventoryBalances } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { InventoryBalance } from "@/lib/types";

export default function ValuationPage() {
  const t = useTranslations("inventory");
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: balances = [], isLoading } = useInventoryBalances(orgId);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const b of balances) {
      if (b.category) set.add(b.category);
    }
    return Array.from(set).sort();
  }, [balances]);

  const filtered = useMemo(() => {
    let list = [...balances];
    if (categoryFilter) {
      list = list.filter((b) => b.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.part_name ?? "").toLowerCase().includes(q) ||
          (b.part_number ?? "").toLowerCase().includes(q),
      );
    }
    return list.map((b) => ({
      ...b,
      avgUnitCost: b.default_price ?? 0,
      totalValue: (b.default_price ?? 0) * (b.quantity_on_hand ?? 0),
    }));
  }, [balances, categoryFilter, search]);

  const totalValue = useMemo(
    () => filtered.reduce((sum, b) => sum + b.totalValue, 0),
    [filtered],
  );

  const exportColumns: ExportColumn<
    InventoryBalance & { avgUnitCost: number; totalValue: number }
  >[] = [
    { key: "part_name", label: t("partName") },
    { key: "category", label: t("category") },
    { key: "quantity_on_hand", label: t("onHand") },
    { key: "avgUnitCost", label: t("avgUnitCost"), format: "currency" },
    { key: "totalValue", label: t("totalValue"), format: "currency" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("valuationTitle")}
        </h1>
        <p className="text-muted-foreground">{t("valuationSubtitle")}</p>
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="flex items-center gap-4 py-6">
          <TrendingUp className="size-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">
              {t("totalInventoryValue")}
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {totalValue.toLocaleString("mn-MN")} ₮
            </p>
          </div>
        </CardContent>
      </Card>

      <ListToolbar
        search={{
          placeholder: t("searchParts"),
          value: search,
          onChange: setSearch,
        }}
        stats={
          <span>
            {filtered.length} {t("parts")}
          </span>
        }
        actions={
          <ExportButton
            data={filtered}
            columns={exportColumns}
            filename={`inventory-valuation-${new Date().toISOString().split("T")[0]}.xlsx`}
            sheetName="Valuation"
          />
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter("")}
          className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
            categoryFilter === ""
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("allCategories")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
              categoryFilter === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 px-4 py-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <TrendingUp className="size-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">{t("noValuationData")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("partName")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("category")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("onHand")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("avgUnitCost")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("totalValue")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr
                    key={b.part_id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">
                      <div>
                        <p>{b.part_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.part_number ?? "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {b.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {b.quantity_on_hand} {b.unit}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {b.avgUnitCost.toLocaleString("mn-MN")} ₮
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {b.totalValue.toLocaleString("mn-MN")} ₮
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
