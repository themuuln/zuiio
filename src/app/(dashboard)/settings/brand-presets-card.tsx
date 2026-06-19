"use client";

import {
  ArrowSquareDown,
  CaretDown,
  CaretRight,
  Check,
  Cube,
  Spinner,
  Storefront,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCompanyTypeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { importBrandPresets, importProductPreset } from "./actions";

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

/**
 * Maps company types to brand names that are relevant for that type.
 * Brands not listed here won't appear in the picker for that org type.
 */
const BRANDS_BY_COMPANY_TYPE: Record<string, string[]> = {
  gym: ["Myprotein", "Thorne", "HiTec Nutrition", "Real Pharm"],
};

function groupByBrand(presets: Preset[]) {
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

export function BrandPresetsCard({
  presets,
  orgCompanyType,
  importedBrandNames,
}: {
  presets: Preset[];
  orgCompanyType: string;
  importedBrandNames: string[];
}) {
  const allowedBrands = BRANDS_BY_COMPANY_TYPE[orgCompanyType];
  const importedSet = new Set(importedBrandNames);
  const router = useRouter();
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  let filtered = groupByBrand(presets);
  if (allowedBrands) {
    filtered = filtered.filter((b) => allowedBrands.includes(b.brandName));
  }

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
      const failed = results.filter((r) => r.error);
      if (succeeded.length > 0) {
        toast.success(
          `${succeeded.map((r) => r.brandName).join(", ")} брэнд(үүд) амжилттай импортлогдлоо.`,
        );
      }
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
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cube className="size-5" />
          Брэнд, бүтээгдэхүүний сан
        </CardTitle>
        <CardDescription>
          <span className="flex items-center gap-1.5">
            <Storefront className="size-3.5" />
            {getCompanyTypeLabel(orgCompanyType)} төрөлд тохирсон брэнд,
            бүтээгдэхүүний загварууд
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Энэ төрлийн байгууллагад тохирсон брэнд загварууд тун удахгүй...
          </p>
        ) : (
          <>
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
                          expandedBrand === brand.brandName
                            ? null
                            : brand.brandName,
                        )
                      }
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50",
                        expandedBrand === brand.brandName &&
                          "border-primary/50",
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
                {/* Expanded product table for imported brands */}
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
                <div className="mb-3 flex items-center justify-between">
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
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectableBrands.map((brand) => (
                    <div
                      key={brand.brandName}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
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
                        className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                {/* Expanded product tables for selectable brands */}
                {selectableBrands
                  .filter((b) => b.brandName === expandedBrand)
                  .map((brand) => (
                    <div key={brand.brandName} className="mt-2">
                      <ProductTable brand={brand} />
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
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
  const [copiedProductIds, setCopiedProductIds] = useState<Set<string>>(
    new Set(),
  );

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

  const handleCopyProduct = (presetId: string) => {
    copyProductMutation.mutate(presetId, {
      onSuccess: (result) => {
        if (!result?.error) {
          setCopiedProductIds((prev) => new Set(prev).add(presetId));
        }
      },
    });
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Бүтээгдэхүүн</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Ангилал</TableHead>
            <TableHead>Өртөг ₮</TableHead>
            <TableHead>Зарах ₮</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brand.products.map((p) => {
            const isCopied = copiedProductIds.has(p.id);
            const isCopying =
              copyProductMutation.isPending &&
              copyProductMutation.variables === p.id;
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.product_name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.product_sku ?? "-"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.category_name ?? "-"}
                </TableCell>
                <TableCell>
                  {p.cost_price && p.cost_price > 0
                    ? p.cost_price.toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  {p.sale_price && p.sale_price > 0
                    ? p.sale_price.toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  {isCopied ? (
                    <Check className="size-4 text-emerald-600 dark:text-emerald-500" />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyProduct(p.id);
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
