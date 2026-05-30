"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ClipboardList,
  GitFork,
  Package,
  Pencil,
  Plus,
  Star,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { PartForm } from "@/components/inventory/part-form";
import { ListToolbar } from "@/components/list-toolbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import type { ExportColumn } from "@/lib/export";
import { inventoryKeys } from "@/lib/queries/keys";
import {
  useGlobalPartsCatalog,
  useInventoryBalances,
  usePartsCatalog,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import type { CreatePartParams, PartsCatalogItem } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import type { SortKey } from "./constants";
import { Modal } from "./modal";
import { SortKeyHeader } from "./sort-key-header";
import { TableSkeleton } from "./table-skeleton";

// Part data from API includes popularity_score joined from analytics
type PartRow = PartsCatalogItem & { popularity_score?: number };

interface PartsTabProps {
  orgId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onNavigate: (tab: string) => void;
}

export function PartsTab({
  orgId,
  search,
  onSearchChange,
  onNavigate,
}: PartsTabProps) {
  const locale = useLocale();
  const t = useTranslations("inventory");
  const now = useClientNow();
  const qc = useQueryClient();

  // Tab views: inventory parts or global reference catalog
  const [partsView, setPartsView] = useState<"inventory" | "global">(
    "inventory",
  );

  // Local organization catalog data
  const {
    data: parts = [],
    isLoading: partsLoading,
    error: partsError,
    isError: isPartsError,
  } = usePartsCatalog(orgId);
  const { data: balances = [] } = useInventoryBalances(orgId);
  const { data: thresholds = [] } = useStockThresholds(orgId);

  // Global catalog data
  const {
    data: globalParts = [],
    isLoading: globalPartsLoading,
    error: globalPartsError,
    isError: isGlobalPartsError,
  } = useGlobalPartsCatalog();

  const [showAddPart, setShowAddPart] = useState(false);
  const [forkingData, setForkingData] =
    useState<Partial<CreatePartParams> | null>(null);
  const [editingPart, setEditingPart] = useState<PartsCatalogItem | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");

  // Local sorting
  const [sortKey, setSortKey] = useState<SortKey>("popularity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Global catalog sorting (only supports Name or Category sorting)
  const [globalSortKey, setGlobalSortKey] = useState<SortKey>("name");
  const [globalSortDir, setGlobalSortDir] = useState<"asc" | "desc">("asc");

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

  // Index organization parts by global_part_id to check if they've been forked already
  const localPartsByGlobalId = useMemo(() => {
    const map = new Map<string, PartsCatalogItem>();
    for (const p of parts) {
      if (p.global_part_id) {
        map.set(p.global_part_id, p);
      }
    }
    return map;
  }, [parts]);

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

  const handleGlobalSort = useCallback(
    (key: SortKey) => {
      if (globalSortKey === key) {
        setGlobalSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setGlobalSortKey(key);
        setGlobalSortDir("asc");
      }
    },
    [globalSortKey],
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

  // Sort and filter global catalog parts
  const sortedGlobalParts = useMemo(() => {
    let filtered = globalParts.filter((p) => p.is_active);
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

      switch (globalSortKey) {
        case "name":
          cmp = aMn.localeCompare(bMn, "mn");
          break;
        case "category":
          cmp = (a.category ?? "").localeCompare(b.category ?? "", "mn");
          break;
      }
      return globalSortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [globalParts, search, globalSortKey, globalSortDir, locale]);

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

  return (
    <div className="flex flex-col gap-4">
      {/* ── Sub-navigation: My Inventory vs Global Reference Catalog ── */}
      <Tabs
        value={partsView}
        onValueChange={(val) => setPartsView(val as "inventory" | "global")}
        className="w-full shrink-0"
      >
        <TabsList className="flex w-fit h-9 p-0.5 rounded-lg bg-muted border border-border">
          <TabsTrigger
            value="inventory"
            className="rounded-md py-1 text-xs justify-center cursor-pointer px-4"
          >
            {t("tabMyInventory")}
          </TabsTrigger>
          <TabsTrigger
            value="global"
            className="rounded-md py-1 text-xs justify-center cursor-pointer px-4"
          >
            {t("tabGlobalCatalog")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ListToolbar
        search={{
          placeholder:
            partsView === "inventory"
              ? t("searchParts")
              : "Search global catalog by name, #, or category...",
          value: search,
          onChange: onSearchChange,
        }}
        stats={
          <span>
            {partsView === "inventory"
              ? `${sortedParts.length} parts`
              : `${sortedGlobalParts.length} parts in global catalog`}
          </span>
        }
        actions={
          partsView === "inventory" ? (
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
              <Button
                size="default"
                onClick={() => {
                  setForkingData(null);
                  setShowAddPart(true);
                }}
              >
                <Plus className="size-4" />
                Add Part
              </Button>
            </div>
          ) : null
        }
      />

      {/* ── Inventory List ── */}
      {partsView === "inventory" &&
        (partsLoading ? (
          <TableSkeleton />
        ) : isPartsError ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Error loading inventory parts</AlertTitle>
            <AlertDescription>
              {partsError instanceof Error
                ? partsError.message
                : "An error occurred while loading the parts catalog."}
            </AlertDescription>
          </Alert>
        ) : parts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16">
              <Package className="size-10 text-muted-foreground/40" />
              <Typography.Muted className="text-muted-foreground">
                {t("noParts")}
              </Typography.Muted>
              <Button
                variant="outline"
                onClick={() => {
                  setForkingData(null);
                  setShowAddPart(true);
                }}
              >
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
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedParts.map((part) => {
                    const bal = balanceMap.get(part.id);
                    const qty = bal?.quantity_on_hand ?? 0;
                    const min = thresholdMap[part.id] ?? 5;
                    const status = qty <= 0 ? "out" : qty < min ? "low" : "ok";
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
                        <TableCell className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {part.part_number ?? "—"}
                        </TableCell>
                        <TableCell className="px-1 py-3">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setEditingPart(part)}
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

      {/* ── Global Catalog List ── */}
      {partsView === "global" &&
        (globalPartsLoading ? (
          <TableSkeleton />
        ) : isGlobalPartsError ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Error loading global catalog</AlertTitle>
            <AlertDescription>
              {globalPartsError instanceof Error
                ? globalPartsError.message
                : "An error occurred while loading the global catalog."}
            </AlertDescription>
          </Alert>
        ) : globalParts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16">
              <Package className="size-10 text-muted-foreground/40" />
              <Typography.Muted className="text-muted-foreground">
                No parts in global reference catalog.
              </Typography.Muted>
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
                        currentSortKey={globalSortKey}
                        sortDir={globalSortDir}
                        onSort={handleGlobalSort}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left">
                      <SortKeyHeader
                        label="Category"
                        sortKey="category"
                        currentSortKey={globalSortKey}
                        sortDir={globalSortDir}
                        onSort={handleGlobalSort}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Unit
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Part #
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status in My Org
                    </TableHead>
                    <TableHead className="w-44 px-4 py-3 text-center font-medium text-muted-foreground" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGlobalParts.map((gp) => {
                    const localPart = localPartsByGlobalId.get(gp.id);
                    return (
                      <TableRow
                        key={gp.id}
                        className="border-b border-border transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="px-4 py-3 font-medium">
                          <div className="flex flex-col">
                            <span>
                              {locale === "mn" && gp.name_mn
                                ? gp.name_mn
                                : gp.name}
                            </span>
                            {locale !== "mn" && gp.name_mn && (
                              <span className="text-xs text-muted-foreground">
                                {gp.name_mn}
                              </span>
                            )}
                            {locale === "mn" && gp.name && (
                              <span className="text-xs text-muted-foreground">
                                {gp.name}
                              </span>
                            )}
                          </div>
                          {gp.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                              {gp.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {gp.category ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {gp.unit}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {gp.part_number ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {localPart ? (
                            <div className="flex flex-col gap-1 items-start">
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                {t("inInventory")}
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {locale === "mn" && localPart.name_mn
                                  ? localPart.name_mn
                                  : localPart.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {localPart ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPart(localPart)}
                              className="w-full gap-1 h-8"
                            >
                              <Pencil className="size-3" />
                              {t("editLocalCopy")}
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setForkingData({
                                  name: gp.name,
                                  name_mn: gp.name_mn ?? undefined,
                                  part_number: gp.part_number ?? undefined,
                                  category: gp.category ?? undefined,
                                  description: gp.description ?? undefined,
                                  unit: gp.unit ?? undefined,
                                  global_part_id: gp.id,
                                });
                                setShowAddPart(true);
                              }}
                              className="w-full gap-1 h-8"
                            >
                              <GitFork className="size-3" />
                              {t("forkToOrg")}
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
        ))}

      {/* Add Part Modal */}
      {showAddPart && (
        <Modal
          title={
            forkingData
              ? `Fork Part: ${locale === "mn" && forkingData.name_mn ? forkingData.name_mn : forkingData.name}`
              : t("addPart")
          }
          onClose={() => {
            setShowAddPart(false);
            setForkingData(null);
          }}
        >
          <PartForm
            initialData={forkingData ?? undefined}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId) });
              qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId) });
              if (forkingData) {
                toast.success(t("forkSuccess"));
              } else {
                toast.success("Part created");
              }
              setShowAddPart(false);
              setForkingData(null);
            }}
            onCancel={() => {
              setShowAddPart(false);
              setForkingData(null);
            }}
          />
        </Modal>
      )}

      {/* Edit Part Modal */}
      {editingPart && (
        <Modal
          title={`Edit: ${editingPart.name}`}
          onClose={() => setEditingPart(null)}
        >
          <PartForm
            partId={editingPart.id}
            initialData={{
              name: editingPart.name,
              name_mn: editingPart.name_mn ?? undefined,
              part_number: editingPart.part_number ?? undefined,
              category: editingPart.category ?? undefined,
              description: editingPart.description ?? undefined,
              unit: editingPart.unit ?? undefined,
              default_price: editingPart.default_price ?? undefined,
            }}
            onSuccess={() => setEditingPart(null)}
            onCancel={() => setEditingPart(null)}
          />
        </Modal>
      )}
    </div>
  );
}
