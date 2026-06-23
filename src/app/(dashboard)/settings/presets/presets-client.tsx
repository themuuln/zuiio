"use client";

import {
  ArrowSquareDown,
  Barcode,
  CaretDown,
  CaretRight,
  Check,
  Package,
  Spinner,
  Tag,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { InfoRow } from "@/components/ui/info-row";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  importBrandPresets,
  importProductPreset,
  importProductPresetsByIds,
} from "../actions";

interface Preset {
  id: string;
  brand_name: string;
  brand_logo_url: string | null;
  product_name: string;
  product_sku: string | null;
  category_name: string | null;
  unit: string | null;
  cost_price: number | null;
  sale_price: number | null;
  min_stock: number | null;
}

interface BrandGroup {
  brandName: string;
  logoUrl: string | null;
  products: Preset[];
  count: number;
}

function groupByBrand(presets: Preset[]): BrandGroup[] {
  const map = new Map<string, Preset[]>();
  for (const p of presets) {
    const arr = map.get(p.brand_name) ?? [];
    arr.push(p);
    map.set(p.brand_name, arr);
  }
  return Array.from(map.entries()).map(([brandName, products]) => ({
    brandName,
    logoUrl: products[0]?.brand_logo_url ?? null,
    products,
    count: products.length,
  }));
}

export function BrandPresetsClient({
  presets,
  importedBrandNames,
}: {
  presets: Preset[];
  importedBrandNames: string[];
}) {
  const router = useRouter();
  const importedSet = new Set(importedBrandNames);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  const filtered = groupByBrand(presets);

  const importSelectedMutation = useMutation({
    mutationFn: async (brandNames: string[]) => {
      const results: { brandName: string; count?: number; error?: string }[] =
        [];
      for (const name of brandNames) {
        const formData = new FormData();
        formData.append("brand_name", name);
        const result = await importBrandPresets(formData);
        results.push({ brandName: name, ...result });
      }
      return results;
    },
    onSuccess: (results) => {
      const succeeded = results.filter((r) => !r.error);
      if (succeeded.length > 0) {
        toast.success(
          `${succeeded.map((r) => r.brandName).join(", ")} амжилттай импортлогдлоо.`,
        );
      }
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        toast.error(
          `${failed.map((r) => r.brandName).join(", ")} импортлоход алдаа гарлаа.`,
        );
      }
      setSelectedBrands(new Set());
      router.refresh();
    },
    onError: () => {
      toast.error("Импортлоход алдаа гарлаа.");
    },
  });

  const toggleBrand = (name: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleImportSelected = () => {
    if (selectedBrands.size === 0) return;
    importSelectedMutation.mutate(Array.from(selectedBrands));
  };

  const selectableBrands = filtered.filter(
    (b) => !importedSet.has(b.brandName),
  );
  const importedBrands = filtered.filter((b) => importedSet.has(b.brandName));
  const hasSelection = selectedBrands.size > 0;

  if (filtered.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Энэ төрлийн байгууллагад тохирсон брэнд загварууд тун удахгүй...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Already imported brands */}
      {importedBrands.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Импортлосон брэндүүд
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {importedBrands.map((brand) => (
              <button
                type="button"
                key={brand.brandName}
                onClick={() =>
                  setExpandedBrand(
                    expandedBrand === brand.brandName ? null : brand.brandName,
                  )
                }
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50",
                  expandedBrand === brand.brandName && "border-primary/50",
                )}
              >
                <Check className="size-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                <BrandInfo brand={brand} />
                <div className="ml-auto text-muted-foreground">
                  {expandedBrand === brand.brandName ? (
                    <CaretDown className="size-4" />
                  ) : (
                    <CaretRight className="size-4" />
                  )}
                </div>
              </button>
            ))}
          </div>
          {importedBrands
            .filter((b) => b.brandName === expandedBrand)
            .map((brand) => (
              <div key={brand.brandName} className="mt-2">
                <ProductTable brand={brand} />
              </div>
            ))}
        </div>
      )}

      {/* Selectable brands */}
      {selectableBrands.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Импортлох брэндээ сонгох
            </p>
            <Button
              size="sm"
              onClick={handleImportSelected}
              disabled={!hasSelection || importSelectedMutation.isPending}
            >
              {importSelectedMutation.isPending ? (
                <>
                  <Spinner className="size-4 animate-spin" />
                  Импортлож байна...
                </>
              ) : (
                `Сонгосоныг импортлох (${selectedBrands.size})`
              )}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectableBrands.map((brand) => (
              <div
                key={brand.brandName}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 transition-colors",
                  selectedBrands.has(brand.brandName) &&
                    "border-primary/50 bg-primary/5",
                )}
              >
                <Checkbox
                  id={`brand-${brand.brandName}`}
                  checked={selectedBrands.has(brand.brandName)}
                  onCheckedChange={() => toggleBrand(brand.brandName)}
                />
                <label
                  htmlFor={`brand-${brand.brandName}`}
                  className="flex flex-1 cursor-pointer items-center gap-3"
                >
                  <BrandInfo brand={brand} />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedBrand(
                      expandedBrand === brand.brandName
                        ? null
                        : brand.brandName,
                    )
                  }
                  className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  title="Бүтээгдэхүүн харах"
                >
                  {expandedBrand === brand.brandName ? (
                    <CaretDown className="size-4" />
                  ) : (
                    <CaretRight className="size-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
          {selectableBrands
            .filter((b) => b.brandName === expandedBrand)
            .map((brand) => (
              <div key={brand.brandName} className="mt-2">
                <ProductTable brand={brand} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function BrandInfo({
  brand,
}: {
  brand: { brandName: string; logoUrl: string | null; count: number };
}) {
  return (
    <div className="flex items-center gap-3">
      {brand.logoUrl ? (
        <img
          src={brand.logoUrl}
          alt={brand.brandName}
          className="size-8 shrink-0 rounded object-contain"
        />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
          {brand.brandName.charAt(0)}
        </div>
      )}
      <div>
        <p className="text-sm font-medium">{brand.brandName}</p>
        <p className="text-xs text-muted-foreground">
          {brand.count} бүтээгдэхүүн
        </p>
      </div>
    </div>
  );
}

function ProductTable({
  brand,
}: {
  brand: { brandName: string; products: Preset[] };
}) {
  const [selectedProducts, setSelectedProducts] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const importSelectedMutation = useMutation({
    mutationFn: async (presetIds: string[]) => {
      return importProductPresetsByIds(presetIds);
    },
    onSuccess: (result, presetIds) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `${result?.count ?? presetIds.length} бүтээгдэхүүн амжилттай импортлогдлоо.`,
        );
        setImportedIds((prev) => {
          const next = new Set(prev);
          for (const id of presetIds) next.add(id);
          return next;
        });
        setSelectedProducts([]);
      }
    },
    onError: () => {
      toast.error("Импортлоход алдаа гарлаа.");
    },
  });

  const copyProductMutation = useMutation({
    mutationFn: async (presetId: string) => {
      const formData = new FormData();
      formData.append("preset_id", presetId);
      return importProductPreset(formData);
    },
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        const productName = result?.name ?? "Бүтээгдэхүүн";
        toast.success(`"${productName}" амжилттай хуулагдлаа.`);
      }
    },
    onError: () => {
      toast.error("Хуулахад алдаа гарлаа.");
    },
  });

  const handleBatchImport = () => {
    const ids = selectedProducts.map((p) => p.id);
    if (ids.length === 0) return;
    importSelectedMutation.mutate(ids);
  };

  const columns: ColumnDef<Preset>[] = useMemo(
    () => [
      {
        accessorKey: "product_name",
        header: "Бүтээгдэхүүн",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.product_name}</span>
        ),
      },
      {
        accessorKey: "product_sku",
        header: "SKU",
        cell: ({ row }) =>
          row.original.product_sku ?? (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "category_name",
        header: "Ангилал",
        cell: ({ row }) =>
          row.original.category_name ?? (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "cost_price",
        header: "Өртөг ₮",
        cell: ({ row }) =>
          row.original.cost_price && row.original.cost_price > 0
            ? row.original.cost_price.toLocaleString()
            : "-",
      },
      {
        accessorKey: "sale_price",
        header: "Зарах ₮",
        cell: ({ row }) =>
          row.original.sale_price && row.original.sale_price > 0
            ? row.original.sale_price.toLocaleString()
            : "-",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const p = row.original;
          const isCopied = importedIds.has(p.id);
          const isCopying =
            copyProductMutation.isPending &&
            copyProductMutation.variables === p.id;
          return (
            <div className="flex justify-end">
              {isCopied ? (
                <Check className="size-4 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyProductMutation.mutate(p.id, {
                      onSuccess: (result) => {
                        if (!result?.error) {
                          setImportedIds((prev) => new Set(prev).add(p.id));
                        }
                      },
                    });
                  }}
                  disabled={isCopying}
                  className={cn(
                    "flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCopying && "cursor-not-allowed opacity-50",
                  )}
                  title="Бүтээгдэхүүн хуулах"
                >
                  {isCopying ? (
                    <Spinner className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowSquareDown className="size-3.5" />
                  )}
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [importedIds, copyProductMutation],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={brand.products}
        totalLabel="бүтээгдэхүүн"
        pageSize={15}
        enableRowSelection
        onRowClick={(row) => setSelectedPreset(row as Preset)}
        onRowSelectionChange={(rows) => setSelectedProducts(rows as Preset[])}
        toolbar={
          selectedProducts.length > 0 && (
            <Button
              size="sm"
              onClick={handleBatchImport}
              disabled={importSelectedMutation.isPending}
            >
              {importSelectedMutation.isPending ? (
                <>
                  <Spinner className="size-4 animate-spin" />
                  Импортлож байна...
                </>
              ) : (
                `Сонгосоныг импортлох (${selectedProducts.length})`
              )}
            </Button>
          )
        }
      />
      <DrawerLayout
        open={!!selectedPreset}
        onOpenChange={(open) => {
          if (!open) setSelectedPreset(null);
        }}
        title={selectedPreset?.product_name}
        description="Бүтээгдэхүүний дэлгэрэнгүй"
      >
        {selectedPreset && (
          <div className="space-y-1 px-6 pb-6">
            {/* Brand info */}
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              {selectedPreset.brand_logo_url ? (
                <img
                  src={selectedPreset.brand_logo_url}
                  alt={selectedPreset.brand_name}
                  className="size-10 shrink-0 rounded object-contain"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted text-sm font-bold text-muted-foreground">
                  {selectedPreset.brand_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Брэнд</p>
                <p className="text-sm font-medium">
                  {selectedPreset.brand_name}
                </p>
              </div>
            </div>

            {/* Detail rows */}
            <div className="divide-y">
              <InfoRow
                icon={<Package className="size-4" />}
                label="Бүтээгдэхүүн"
                value={selectedPreset.product_name}
              />
              <InfoRow
                icon={<Tag className="size-4" />}
                label="SKU"
                value={selectedPreset.product_sku ?? "-"}
              />
              <InfoRow
                icon={<Barcode className="size-4" />}
                label="Ангилал"
                value={selectedPreset.category_name ?? "Ангилаагүй"}
              />
              <InfoRow label="Нэгж" value={selectedPreset.unit ?? "ширхэг"} />
              <InfoRow
                label="Өртөг үнэ"
                value={
                  selectedPreset.cost_price && selectedPreset.cost_price > 0
                    ? formatCurrency(selectedPreset.cost_price)
                    : "-"
                }
              />
              <InfoRow
                label="Зарах үнэ"
                value={
                  selectedPreset.sale_price && selectedPreset.sale_price > 0
                    ? formatCurrency(selectedPreset.sale_price)
                    : "-"
                }
              />
              <InfoRow
                label="Доод үлдэгдэл"
                value={
                  selectedPreset.min_stock != null
                    ? `${selectedPreset.min_stock} ${selectedPreset.unit ?? "ширхэг"}`
                    : "-"
                }
              />
            </div>
          </div>
        )}
      </DrawerLayout>
    </>
  );
}
