"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExportColumn } from "@/lib/export";
import { useInventoryBalances } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { InventoryBalanceWithAvgCost } from "@/lib/types";

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
      avgUnitCost: b.avg_unit_cost,
      totalValue: b.avg_unit_cost * (b.quantity_on_hand ?? 0),
    }));
  }, [balances, categoryFilter, search]);

  const totalValue = useMemo(
    () => filtered.reduce((sum, b) => sum + b.totalValue, 0),
    [filtered],
  );

  const exportColumns: ExportColumn<
    InventoryBalanceWithAvgCost & { avgUnitCost: number; totalValue: number }
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
        <h1 className="text-2xl font-semibold tracking-tight">
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
            <p className="text-2xl font-semibold tabular-nums">
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
              <p className="text-muted-foreground">{t("noValuationData")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("partName")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t("category")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("onHand")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("avgUnitCost")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {t("totalValue")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filtered.map((b) => (
                  <TableRow
                    key={b.part_id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      <div>
                        <p>{b.part_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.part_number ?? "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {b.category ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {b.quantity_on_hand} {b.unit}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {b.avgUnitCost.toLocaleString("mn-MN")} ₮
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold tabular-nums">
                      {b.totalValue.toLocaleString("mn-MN")} ₮
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
