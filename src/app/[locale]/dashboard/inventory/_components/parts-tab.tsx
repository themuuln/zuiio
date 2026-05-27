"use client";

import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ClipboardList,
  Package,
  Plus,
  Star,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClientNow } from "@/hooks/use-client-now";
import { inventoryKeys } from "@/lib/queries/keys";
import {
  useInventoryBalances,
  usePartsCatalog,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import type { ExportColumn } from "@/lib/export";
import type { PartsCatalogItem } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { Modal } from "./modal";
import { TableSkeleton } from "./table-skeleton";
import { SortKeyHeader } from "./sort-key-header";
import type { SortKey } from "./constants";

// Part data from API includes popularity_score joined from analytics
type PartRow = PartsCatalogItem & { popularity_score?: number };

interface PartsTabProps {
  orgId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onNavigate: (tab: string) => void;
}

export function PartsTab({ orgId, search, onSearchChange, onNavigate }: PartsTabProps) {
  const locale = useLocale();
  const t = useTranslations("inventory");
  const now = useClientNow();
  const qc = useQueryClient();

  const {
    data: parts = [],
    isLoading: partsLoading,
  } = usePartsCatalog(orgId);
  const { data: balances = [] } = useInventoryBalances(orgId);
  const { data: thresholds = [] } = useStockThresholds(orgId);

  const [showAddPart, setShowAddPart] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("popularity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  const createPart = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId) });
      qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId) });
      toast.success("Part created");
      setShowAddPart(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });


  const saveThreshold = useMutation({
    mutationFn: async ({
      partId,
      minimumQuantity,
    }: {
      partId: string;
      minimumQuantity: number;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory/thresholds`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part_id: partId,
            minimum_quantity: minimumQuantity,
          }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.thresholds(orgId) });
      toast.success("Threshold saved");
      setEditingThreshold(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });


  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );


  const sortedParts = useMemo(() => {
    let filtered = parts.filter((p) => p.is_active);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.name_mn?.toLowerCase().includes(q) ?? false) ||
          (p.part_number?.toLowerCase().includes(q) ?? false) ||
          (p.category?.toLowerCase().includes(q) ?? false),
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      const aMn = locale === "mn" && a.name_mn ? a.name_mn : a.name;
      const bMn = locale === "mn" && b.name_mn ? b.name_mn : b.name;

      switch (sortKey) {
        case "name":
          cmp = aMn.localeCompare(bMn, "mn");
          break;
        case "category":
          cmp = (a.category ?? "").localeCompare(b.category ?? "", "mn");
          break;
        case "price":
          cmp = (a.default_price ?? 0) - (b.default_price ?? 0);
          break;
        case "stock": {
          const aQty = balanceMap.get(a.id)?.quantity_on_hand ?? 0;
          const bQty = balanceMap.get(b.id)?.quantity_on_hand ?? 0;
          cmp = aQty - bQty;
          break;
        }
        case "popularity":
          cmp = (a.popularity_score ?? 0) - (b.popularity_score ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [parts, search, sortKey, sortDir, balanceMap, locale]);


  const partExportColumns: ExportColumn<
    PartRow & { quantity_on_hand?: number; stock_status?: string }
  >[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        value: (p) => (locale === "mn" && p.name_mn ? p.name_mn : p.name),
      },
      { key: "part_number", label: "Part #" },
      { key: "category", label: "Category" },
      { key: "default_price", label: "Price", format: "currency" },
      { key: "quantity_on_hand", label: "On Hand" },
      { key: "stock_status", label: "Status" },
    ],
    [locale],
  );


  function handleAddPart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createPart.mutate({
      name: form.get("name"),
      name_mn: form.get("name_mn") || undefined,
      part_number: form.get("part_number") || undefined,
      category: form.get("category") || undefined,
      description: form.get("description") || undefined,
      unit: form.get("unit") || "piece",
      default_price: form.get("default_price")
        ? Number(form.get("default_price"))
        : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        search={{
          placeholder: t("searchParts"),
          value: search,
          onChange: onSearchChange,
        }}
        stats={<span>{sortedParts.length} parts</span>}
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              data={sortedParts.map((p) => {
                const bal = balanceMap.get(p.id);
                const qty = bal?.quantity_on_hand ?? 0;
                const min = thresholdMap[p.id] ?? 5;
                const status =
                  qty <= 0
                    ? "Out of Stock"
                    : qty < min
                      ? "Low Stock"
                      : "In Stock";
                return {
                  ...p,
                  quantity_on_hand: qty,
                  stock_status: status,
                };
              })}
              columns={partExportColumns}
              filename={`inventory-parts-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Parts"
            />
            <Button size="default" onClick={() => onNavigate("movements")}>
              <ClipboardList className="size-4" />
              {t("recordMovement")}
            </Button>
            <Button size="default" onClick={() => setShowAddPart(true)}>
              <Plus className="size-4" />
              Add Part
            </Button>
          </div>
        }
      />

      {partsLoading ? (
        <TableSkeleton />
      ) : parts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Package className="size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">{t("noParts")}</p>
            <Button variant="outline" onClick={() => setShowAddPart(true)}>
              {t("addFirstPart")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 text-left">
                    <SortKeyHeader
                      label="Name"
                      sortKey="name"
                      currentSortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left">
                    <SortKeyHeader
                      label="Popularity"
                      sortKey="popularity"
                      currentSortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      icon={Star}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left">
                    <SortKeyHeader
                      label="Category"
                      sortKey="category"
                      currentSortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right">
                    <SortKeyHeader
                      label="Default Price"
                      sortKey="price"
                      currentSortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right">
                    <SortKeyHeader
                      label="On Hand"
                      sortKey="stock"
                      currentSortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Min
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Part #
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedParts.map((part) => {
                  const bal = balanceMap.get(part.id);
                  const qty = bal?.quantity_on_hand ?? 0;
                  const min = thresholdMap[part.id] ?? 5;
                  const status =
                    qty <= 0 ? "out" : qty < min ? "low" : "ok";
                  return (
                    <TableRow
                      key={part.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="px-4 py-3 font-medium">
                        {locale === "mn" && part.name_mn
                          ? part.name_mn
                          : part.name}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {part.popularity_score != null && (
                          <Badge variant="outline" className="gap-1">
                            {part.popularity_score >= 80 ? (
                              <Star className="size-3" />
                            ) : null}
                            {part.popularity_score}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {part.part_number ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {part.category ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {part.default_price
                          ? formatMNT(part.default_price)
                          : "—"}
                      </TableCell>
                      <TableCell
                        className={`px-4 py-3 text-right font-semibold tabular-nums ${
                          status === "out"
                            ? "text-red-600"
                            : status === "low"
                              ? "text-amber-600"
                              : "text-green-600"
                        }`}
                      >
                        {qty} {part.unit}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Badge variant="outline" className="gap-1">
                          {status === "out" && (
                            <AlertTriangle className="size-3" />
                          )}
                          {status === "out"
                            ? t("outOfStock")
                            : status === "low"
                              ? t("lowStock")
                              : t("inStock")}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {editingThreshold === part.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              value={thresholdValue}
                              onChange={(e) =>
                                setThresholdValue(e.target.value)
                              }
                              className="h-8 w-16 text-center"
                              min={0}
                            />
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                saveThreshold.mutate({
                                  partId: part.id,
                                  minimumQuantity:
                                    Number(thresholdValue) || 0,
                                })
                              }
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setEditingThreshold(part.id);
                              setThresholdValue(
                                String(thresholdMap[part.id] ?? 5),
                              );
                            }}
                          >
                            {thresholdMap[part.id] ?? 5}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Part Modal */}
      {showAddPart && (
        <Modal title={t("addPart")} onClose={() => setShowAddPart(false)}>
          <form onSubmit={handleAddPart} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="part-name" className="text-sm font-medium">
                Name *
              </label>
              <Input
                id="part-name"
                name="name"
                required
                placeholder="Oil filter"
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="part-name-mn" className="text-sm font-medium">
                Монгол нэр
              </label>
              <Input
                id="part-name-mn"
                name="name_mn"
                placeholder="Тосны шүүлтүүр"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="part-number" className="text-sm font-medium">
                  Part Number
                </label>
                <Input
                  id="part-number"
                  name="part_number"
                  placeholder="OF-101"
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="part-category" className="text-sm font-medium">
                  Category
                </label>
                <Input
                  id="part-category"
                  name="category"
                  placeholder="Filters"
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="part-description"
                className="text-sm font-medium"
              >
                Description
              </label>
              <Input
                id="part-description"
                name="description"
                placeholder="Optional description"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="part-unit" className="text-sm font-medium">
                  Unit
                </label>
                <Input
                  id="part-unit"
                  name="unit"
                  defaultValue="piece"
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="part-default-price"
                  className="text-sm font-medium"
                >
                  Default Price (₮)
                </label>
                <Input
                  id="part-default-price"
                  name="default_price"
                  type="number"
                  min="0"
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddPart(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPart.isPending}>
                Create Part
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
