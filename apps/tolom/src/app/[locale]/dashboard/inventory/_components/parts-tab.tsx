"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  Gauge,
  Loader2,
  Package,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumericInput } from "@/components/ui/numeric-input";
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
import { Link } from "@/lib/i18n/navigation";
import { inventoryKeys } from "@/lib/queries/keys";
import {
  useDeletePart,
  useGlobalPartsCatalog,
  useInventoryBalances,
  usePartsCatalog,
  useStockThresholds,
} from "@/lib/queries/use-inventory";
import { useSaveThreshold } from "@/lib/queries/use-thresholds";
import type { CreatePartParams, PartsCatalogItem } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import type { SortKey } from "./constants";
import { SortKeyHeader } from "./sort-key-header";
import { TableSkeleton } from "./table-skeleton";

// Dynamically imported to avoid SSR issues -- one of its transitive
// dependencies (heic2any) references window at module evaluation time.
const PartForm = dynamic(
  () => import("@/components/inventory/part-form").then((m) => m.PartForm),
  { ssr: false },
);

// Part data from API includes popularity_score joined from analytics
type PartRow = PartsCatalogItem & { popularity_score?: number };

interface PartsTabProps {
  orgId: string;
  branchFilter?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onNavigate: (tab: string) => void;
}

export function PartsTab({
  orgId,
  branchFilter,
  search,
  onSearchChange,
  onNavigate,
}: PartsTabProps) {
  const locale = useLocale();
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const commonT = useTranslations("common") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const now = useClientNow();
  const qc = useQueryClient();

  // Tab views: inventory parts or global reference catalog
  const [partsView, setPartsView] = useState<"inventory" | "global">(
    "inventory",
  );

  // Local organization catalog data
  const {
    data: parts = [],
    isPending: partsLoading,
    error: partsError,
    isError: isPartsError,
  } = usePartsCatalog(orgId, branchFilter);
  const { data: balances = [] } = useInventoryBalances(orgId, branchFilter);
  const { data: thresholds = [] } = useStockThresholds(orgId, branchFilter);

  // Global catalog data
  const {
    data: globalParts = [],
    isPending: globalPartsLoading,
    error: globalPartsError,
    isError: isGlobalPartsError,
  } = useGlobalPartsCatalog();

  const [showAddPart, setShowAddPart] = useState(false);
  const [forkingData, setForkingData] =
    useState<Partial<CreatePartParams> | null>(null);
  const [editingPart, setEditingPart] = useState<PartsCatalogItem | null>(null);
  const [viewingPart, setViewingPart] = useState<PartsCatalogItem | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [showDefaultThreshold, setShowDefaultThreshold] = useState(false);
  const [defaultThresholdValue, setDefaultThresholdValue] = useState("5");
  const [deletingPart, setDeletingPart] = useState<PartsCatalogItem | null>(
    null,
  );

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

  const saveThreshold = useSaveThreshold(orgId);
  const handleSaveThreshold = async (
    partId: string,
    minimumQuantity: number,
  ) => {
    await saveThreshold.mutateAsync({ partId, minimumQuantity });
    setEditingThreshold(null);
  };
  const deletePart = useDeletePart(orgId);
  const handleDeletePart = async () => {
    if (!deletingPart) return;
    try {
      await deletePart.mutateAsync(deletingPart.id);
      setDeletingPart(null);
    } catch {
      // toast handled by mutation
    }
  };

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
          (p.category?.toLowerCase().includes(q) ?? false) ||
          (p.location?.toLowerCase().includes(q) ?? false),
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

  const partsWithoutThresholdCount = useMemo(() => {
    return sortedParts.filter((p) => !thresholdMap[p.id]).length;
  }, [sortedParts, thresholdMap]);

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
            {partsView === "inventory" && partsWithoutThresholdCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {t("partsNoThreshold", { count: partsWithoutThresholdCount })}
              </Badge>
            )}
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
              <Button
                variant="outline"
                size="default"
                render={<Link href="/dashboard/inventory/import" />}
              >
                <Upload className="size-4" />
                Import
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowDefaultThreshold(true)}
              >
                <Gauge className="size-4" />
                {t("setDefaultThreshold")}
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
            <AlertTitle>{t("inventory.errorLoadingParts")}</AlertTitle>
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
            {/* Desktop: table view */}
            <div className="hidden md:block">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="px-3 py-1.5 text-left">
                        <SortKeyHeader
                          label="Name"
                          sortKey="name"
                          currentSortKey={sortKey}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-left">
                        <SortKeyHeader
                          label="Popularity"
                          sortKey="popularity"
                          currentSortKey={sortKey}
                          sortDir={sortDir}
                          onSort={handleSort}
                          icon={Star}
                        />
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-left">
                        <SortKeyHeader
                          label="Category"
                          sortKey="category"
                          currentSortKey={sortKey}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-right">
                        <SortKeyHeader
                          label="Default Price"
                          sortKey="price"
                          currentSortKey={sortKey}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-right">
                        <SortKeyHeader
                          label="On Hand"
                          sortKey="stock"
                          currentSortKey={sortKey}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-center font-medium text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-center font-medium text-muted-foreground">
                        Min
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-left font-medium text-muted-foreground">
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
                      const status =
                        qty <= 0 ? "out" : qty < min ? "low" : "ok";
                      return (
                        <TableRow
                          key={part.id}
                          className="border-b border-border transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="px-3 py-1.5 font-medium">
                            <Link
                              href={`/dashboard/inventory/parts/${part.id}`}
                              className="hover:underline text-foreground"
                            >
                              {locale === "mn" && part.name_mn
                                ? part.name_mn
                                : part.name}
                            </Link>
                          </TableCell>
                          <TableCell className="px-3 py-1.5">
                            {part.popularity_score != null && (
                              <Badge variant="outline" className="gap-1">
                                {part.popularity_score >= 80 ? (
                                  <Star className="size-3" />
                                ) : null}
                                {part.popularity_score}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-1.5 text-muted-foreground">
                            {part.category ?? "—"}
                          </TableCell>
                          <TableCell className="px-3 py-1.5 text-right tabular-nums">
                            {part.default_price
                              ? formatMNT(part.default_price)
                              : "—"}
                          </TableCell>
                          <TableCell
                            className={`px-3 py-1.5 text-right font-semibold tabular-nums ${
                              status === "out"
                                ? "text-destructive"
                                : status === "low"
                                  ? "text-amber-600"
                                  : ""
                            }`}
                          >
                            {qty} {part.unit}
                          </TableCell>
                          <TableCell className="px-3 py-1.5 text-center">
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
                          <TableCell className="px-3 py-1.5 text-center">
                            {editingThreshold === part.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <NumericInput
                                  value={Number(thresholdValue) || 0}
                                  onChange={(qty) =>
                                    setThresholdValue(String(qty))
                                  }
                                  className="h-8 w-16 text-center"
                                  min={0}
                                />
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handleSaveThreshold(
                                      part.id,
                                      Number(thresholdValue) || 0,
                                    )
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
                          <TableCell className="px-3 py-1.5 text-muted-foreground font-mono text-xs">
                            {part.part_number ?? "—"}
                          </TableCell>
                          <TableCell className="px-1 py-1.5">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setViewingPart(part)}
                                title="View"
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setEditingPart(part)}
                                title="Edit"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setDeletingPart(part)}
                                title={t("delete")}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </div>
            {/* Mobile: card view */}
            <div className="grid gap-2 md:hidden p-3">
              {sortedParts.map((part) => {
                const bal = balanceMap.get(part.id);
                const qty = bal?.quantity_on_hand ?? 0;
                const min = thresholdMap[part.id] ?? 5;
                const status = qty <= 0 ? "out" : qty < min ? "low" : "ok";
                return (
                  <div
                    key={part.id}
                    className="flex flex-col border border-border/50 rounded-lg p-3 gap-y-2 text-sm"
                  >
                    {/* top row: name + part number + actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/inventory/parts/${part.id}`}
                          className="font-medium hover:underline text-foreground line-clamp-1"
                        >
                          {locale === "mn" && part.name_mn
                            ? part.name_mn
                            : part.name}
                        </Link>
                        {part.popularity_score != null && (
                          <Badge variant="outline" className="gap-1 mt-0.5">
                            {part.popularity_score >= 80 ? (
                              <Star className="size-3" />
                            ) : null}
                            {part.popularity_score}
                          </Badge>
                        )}
                        {part.part_number && (
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {part.part_number}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setViewingPart(part)}
                          title="View"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setEditingPart(part)}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeletingPart(part)}
                          title={t("delete")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {/* info grid: category, price, qty, status */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          {t("category")}
                        </span>
                        <p className="font-medium truncate mt-0.5">
                          {part.category ?? "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t("price")}
                        </span>
                        <p className="font-medium tabular-nums mt-0.5">
                          {part.default_price
                            ? formatMNT(part.default_price)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t("onHand")}
                        </span>
                        <p
                          className={`font-semibold tabular-nums mt-0.5 ${
                            status === "out"
                              ? "text-destructive"
                              : status === "low"
                                ? "text-amber-600"
                                : ""
                          }`}
                        >
                          {qty} {part.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t("status")}
                        </span>
                        <div className="mt-0.5">
                          <Badge
                            variant="outline"
                            className="gap-1 text-[10px] px-1.5 py-0"
                          >
                            {status === "out" && (
                              <AlertTriangle className="size-2.5" />
                            )}
                            {status === "out"
                              ? t("outOfStock")
                              : status === "low"
                                ? t("lowStock")
                                : t("inStock")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {/* min threshold row */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                      <span className="text-muted-foreground text-xs">
                        {t("minThreshold")}
                      </span>
                      {editingThreshold === part.id ? (
                        <div className="flex items-center gap-1">
                          <NumericInput
                            value={Number(thresholdValue) || 0}
                            onChange={(qty) => setThresholdValue(String(qty))}
                            className="h-7 w-14 text-center"
                            min={0}
                          />
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              handleSaveThreshold(
                                part.id,
                                Number(thresholdValue) || 0,
                              )
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
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

      {/* ── Global Catalog List ── */}
      {partsView === "global" &&
        (globalPartsLoading ? (
          <TableSkeleton />
        ) : isGlobalPartsError ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>{t("inventory.errorLoadingGlobal")}</AlertTitle>
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
            {/* Desktop: table view */}
            <div className="hidden md:block">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="px-3 py-1.5 text-left">
                        <SortKeyHeader
                          label="Name"
                          sortKey="name"
                          currentSortKey={globalSortKey}
                          sortDir={globalSortDir}
                          onSort={handleGlobalSort}
                        />
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-left">
                        <SortKeyHeader
                          label="Category"
                          sortKey="category"
                          currentSortKey={globalSortKey}
                          sortDir={globalSortDir}
                          onSort={handleGlobalSort}
                        />
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                        Unit
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                        Part #
                      </TableHead>
                      <TableHead className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                        Status in My Org
                      </TableHead>
                      <TableHead className="w-44 px-3 py-1.5 text-center font-medium text-muted-foreground" />
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
                          <TableCell className="px-3 py-1.5 font-medium">
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
                          <TableCell className="px-3 py-1.5 text-muted-foreground">
                            {gp.category ?? "—"}
                          </TableCell>
                          <TableCell className="px-3 py-1.5 text-muted-foreground">
                            {gp.unit}
                          </TableCell>
                          <TableCell className="px-3 py-1.5 text-muted-foreground font-mono text-xs">
                            {gp.part_number ?? "—"}
                          </TableCell>
                          <TableCell className="px-3 py-1.5">
                            {localPart ? (
                              <div className="flex flex-col gap-1 items-start">
                                <Badge variant="secondary">
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
                          <TableCell className="px-3 py-1.5 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (localPart) {
                                  setEditingPart(localPart);
                                } else {
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
                                }
                              }}
                              className="w-full gap-1 h-8"
                            >
                              <Pencil className="size-3" />
                              {t("editLocalCopy")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </div>
            {/* Mobile: card view */}
            <div className="grid gap-2 md:hidden p-3">
              {sortedGlobalParts.map((gp) => {
                const localPart = localPartsByGlobalId.get(gp.id);
                return (
                  <div
                    key={gp.id}
                    className="flex flex-col border border-border/50 rounded-lg p-3 gap-y-2 text-sm"
                  >
                    {/* name row */}
                    <div>
                      <span className="font-medium text-foreground line-clamp-1">
                        {locale === "mn" && gp.name_mn ? gp.name_mn : gp.name}
                      </span>
                      {locale !== "mn" && gp.name_mn && (
                        <span className="text-xs text-muted-foreground block">
                          {gp.name_mn}
                        </span>
                      )}
                      {locale === "mn" && gp.name && (
                        <span className="text-xs text-muted-foreground block">
                          {gp.name}
                        </span>
                      )}
                      {gp.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {gp.description}
                        </div>
                      )}
                    </div>
                    {/* info grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          {t("category")}
                        </span>
                        <p className="font-medium truncate mt-0.5">
                          {gp.category ?? "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit</span>
                        <p className="font-medium mt-0.5">{gp.unit}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t("partNumber")}
                        </span>
                        <p className="font-mono mt-0.5">
                          {gp.part_number ?? "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Status in My Org
                        </span>
                        <div className="mt-0.5">
                          {localPart ? (
                            <Badge variant="secondary">
                              {t("inInventory")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* action button */}
                    <div className="pt-1.5 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (localPart) {
                            setEditingPart(localPart);
                          } else {
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
                          }
                        }}
                        className="w-full gap-1 h-8"
                      >
                        <Pencil className="size-3" />
                        {t("editLocalCopy")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

      {/* Add Part Drawer */}
      <DetailDrawer
        open={showAddPart}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddPart(false);
            setForkingData(null);
          }
        }}
        size="lg"
      >
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            {forkingData
              ? `${t("edit")}: ${locale === "mn" && forkingData.name_mn ? forkingData.name_mn : forkingData.name}`
              : t("addPart")}
          </DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <PartForm
            formId="add-part-drawer-form"
            hideActions
            initialData={forkingData ?? undefined}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: inventoryKeys.parts(orgId) });
              qc.invalidateQueries({ queryKey: inventoryKeys.balances(orgId) });
              if (forkingData) {
                toast.success(t("forkSuccess"));
              } else {
                toast.success(t("partCreated"));
              }
              setShowAddPart(false);
              setForkingData(null);
            }}
            onCancel={() => {
              setShowAddPart(false);
              setForkingData(null);
            }}
          />
        </DetailDrawer.Body>
        <DetailDrawer.Footer>
          <DetailDrawer.FooterActions>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAddPart(false);
                setForkingData(null);
              }}
            >
              {commonT("cancel")}
            </Button>
            <Button
              type="submit"
              form="add-part-drawer-form"
              className="flex-1 gap-2"
              size="lg"
            >
              {forkingData ? commonT("save") : commonT("create")}
            </Button>
          </DetailDrawer.FooterActions>
        </DetailDrawer.Footer>
      </DetailDrawer>

      {/* Edit Part Drawer */}
      <DetailDrawer
        open={!!editingPart}
        onOpenChange={(open) => {
          if (!open) setEditingPart(null);
        }}
        size="lg"
      >
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            {editingPart
              ? `${t("edit")}: ${locale === "mn" && editingPart.name_mn ? editingPart.name_mn : editingPart.name}`
              : ""}
          </DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          {editingPart && (
            <PartForm
              formId="edit-part-drawer-form"
              hideActions
              partId={editingPart.id}
              initialData={{
                name: editingPart.name,
                name_mn: editingPart.name_mn ?? undefined,
                part_number: editingPart.part_number ?? undefined,
                category: editingPart.category ?? undefined,
                description: editingPart.description ?? undefined,
                unit: editingPart.unit ?? undefined,
                default_price: editingPart.default_price ?? undefined,
                purchase_price: editingPart.purchase_price ?? undefined,
                image_url: editingPart.image_url ?? undefined,
                location: editingPart.location ?? undefined,
              }}
              onSuccess={() => setEditingPart(null)}
              onCancel={() => setEditingPart(null)}
            />
          )}
        </DetailDrawer.Body>
        <DetailDrawer.Footer>
          <DetailDrawer.FooterActions>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setEditingPart(null)}
            >
              {commonT("cancel")}
            </Button>
            <Button
              type="submit"
              form="edit-part-drawer-form"
              className="flex-1 gap-2"
              size="lg"
            >
              {commonT("save")}
            </Button>
          </DetailDrawer.FooterActions>
        </DetailDrawer.Footer>
      </DetailDrawer>

      {/* View Part Drawer — Enhanced with summary + actions */}
      <DetailDrawer
        open={!!viewingPart}
        onOpenChange={(open) => {
          if (!open) setViewingPart(null);
        }}
        size="lg"
      >
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            {viewingPart
              ? locale === "mn" && viewingPart.name_mn
                ? viewingPart.name_mn
                : viewingPart.name
              : ""}
          </DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          {viewingPart && (
            <div className="flex flex-col gap-4">
              {/* Summary Card */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {t("price")}
                      </span>
                      <p className="font-medium">
                        {viewingPart.default_price
                          ? formatMNT(viewingPart.default_price)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t("onHand")}
                      </span>
                      <p className="font-medium">
                        {balanceMap.get(viewingPart.id)?.quantity_on_hand ?? 0}{" "}
                        {viewingPart.unit ?? "piece"}
                      </p>
                    </div>
                    {viewingPart.category && (
                      <div>
                        <span className="text-muted-foreground">
                          {t("category")}
                        </span>
                        <p className="font-medium">{viewingPart.category}</p>
                      </div>
                    )}
                    {thresholdMap[viewingPart.id] != null && (
                      <div>
                        <span className="text-muted-foreground">
                          {t("minThreshold")}
                        </span>
                        <p className="font-medium">
                          {thresholdMap[viewingPart.id]}{" "}
                          {viewingPart.unit ?? "piece"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detail Form (read-only) */}
              <PartForm
                readOnly
                initialData={{
                  name: viewingPart.name,
                  name_mn: viewingPart.name_mn ?? undefined,
                  part_number: viewingPart.part_number ?? undefined,
                  category: viewingPart.category ?? undefined,
                  description: viewingPart.description ?? undefined,
                  unit: viewingPart.unit ?? undefined,
                  default_price: viewingPart.default_price ?? undefined,
                  image_url: viewingPart.image_url ?? undefined,
                  location: viewingPart.location ?? undefined,
                }}
                onCancel={() => setViewingPart(null)}
              />
            </div>
          )}
        </DetailDrawer.Body>
        <DetailDrawer.Footer>
          <DetailDrawer.FooterActions>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setViewingPart(null)}
            >
              {commonT("close")}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => {
                if (viewingPart) {
                  setEditingPart(viewingPart);
                  setViewingPart(null);
                }
              }}
            >
              <Pencil className="size-4" />
              {t("edit")}
            </Button>
            <Link
              href={`/dashboard/inventory/parts/${viewingPart?.id}`}
              className="flex-1"
            >
              <Button className="w-full gap-1.5">
                <Eye className="size-4" />
                {t("viewFull")}
              </Button>
            </Link>
          </DetailDrawer.FooterActions>
        </DetailDrawer.Footer>
      </DetailDrawer>

      {/* Set Default Threshold Dialog */}
      {showDefaultThreshold && (
        <Dialog
          open={showDefaultThreshold}
          onOpenChange={setShowDefaultThreshold}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("setDefaultThreshold")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t("defaultThresholdDescription")}
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                {t("defaultThreshold")}
              </label>
              <NumericInput
                value={Number(defaultThresholdValue) || 0}
                onChange={(qty) => setDefaultThresholdValue(String(qty))}
                className="h-10 w-24"
                min={0}
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDefaultThreshold(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={() => {
                  const val = Number(defaultThresholdValue);
                  if (val < 0) return;
                  const partsNoThreshold = sortedParts.filter(
                    (p) => !thresholdMap[p.id],
                  );
                  if (partsNoThreshold.length === 0) {
                    toast.success(t("inventory.allPartsHaveThreshold"));
                    setShowDefaultThreshold(false);
                    return;
                  }
                  Promise.all(
                    partsNoThreshold.map((p) =>
                      fetch(
                        `/api/organizations/${orgId}/inventory/thresholds`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            part_id: p.id,
                            minimum_quantity: val,
                          }),
                        },
                      ).then((r) => r.json()),
                    ),
                  )
                    .then((results) => {
                      const error = results.find((r) => r.error);
                      if (error) throw new Error(error.error.message);
                      qc.invalidateQueries({
                        queryKey: inventoryKeys.thresholds(orgId),
                      });
                      toast.success(
                        `${t("thresholdSet", { count: partsNoThreshold.length })}`,
                      );
                      setShowDefaultThreshold(false);
                    })
                    .catch((err: Error) => toast.error(err.message));
                }}
                disabled={Number(defaultThresholdValue) < 0}
              >
                {t("confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Delete Part Confirmation Dialog */}
      {deletingPart && (
        <Dialog
          open={!!deletingPart}
          onOpenChange={(open) => {
            if (!open) setDeletingPart(null);
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("deletePart")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t("deletePartConfirm", {
                name:
                  locale === "mn" && deletingPart.name_mn
                    ? deletingPart.name_mn
                    : deletingPart.name,
              })}
            </p>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeletingPart(null)}
                disabled={deletePart.isPending}
              >
                {commonT("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePart}
                disabled={deletePart.isPending}
              >
                {deletePart.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t("delete")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
