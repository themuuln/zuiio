"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import { useInventoryBalances } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { ValuationRow } from "./_columns";
import { columns } from "./_columns";

export default function ValuationPage() {
  const t = useTranslations("inventory");
  const now = useClientNow();
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

  const filtered: ValuationRow[] = useMemo(() => {
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
      avgUnitCost: b.avg_unit_cost,
      totalValue: b.avg_unit_cost * (b.quantity_on_hand ?? 0),
    }));
  }, [balances, categoryFilter, search]);

  const totalValue = useMemo(
    () => filtered.reduce((sum, b) => sum + b.totalValue, 0),
    [filtered],
  );

  const exportColumns: ExportColumn<ValuationRow>[] = [
    { key: "part_name", label: t("partName") },
    { key: "category", label: t("category") },
    { key: "quantity_on_hand", label: t("onHand") },
    { key: "avgUnitCost", label: t("avgUnitCost"), format: "currency" },
    { key: "totalValue", label: t("totalValue"), format: "currency" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("valuationTitle")}
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          {t("valuationSubtitle")}
        </Typography.Muted>
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="flex items-center gap-4 py-6">
          <TrendingUp className="size-8 text-primary" />
          <div>
            <Typography.Muted className="text-sm text-muted-foreground">
              {t("totalInventoryValue")}
            </Typography.Muted>
            <Typography.Text className="text-2xl font-semibold tabular-nums">
              {totalValue.toLocaleString("mn-MN")} ₮
            </Typography.Text>
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
            filename={`inventory-valuation-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName="Valuation"
          />
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant={categoryFilter === "" ? "default" : "outline"}
          onClick={() => setCategoryFilter("")}
          className="rounded-full"
        >
          {t("allCategories")}
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? "default" : "outline"}
            onClick={() => setCategoryFilter(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <TrendingUp className="size-10 text-muted-foreground/40" />
              <Typography.Muted className="text-muted-foreground">
                {t("noValuationData")}
              </Typography.Muted>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              getRowId={(row) =>
                row.part_id ?? row.part_name ?? Math.random().toString()
              }
              pageSize={20}
              renderMobileCard={(v) => (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium truncate">{v.part_name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {v.part_number || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                    <span>{v.category || "—"}</span>
                    <span className="tabular-nums">
                      {v.quantity_on_hand} {v.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Avg: {v.avgUnitCost.toLocaleString("mn-MN")} ₮
                    </span>
                    <span className="font-semibold tabular-nums text-sm">
                      {v.totalValue.toLocaleString("mn-MN")} ₮
                    </span>
                  </div>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
