"use client";

import { Check, Spinner, Cube, Storefront } from "@phosphor-icons/react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCompanyTypeLabel } from "@/lib/constants";
import { importBrandPresets, toggleBrandPreset } from "./actions";

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
  disabledBrandNames = [],
}: {
  presets: Preset[];
  orgCompanyType: string;
  importedBrandNames: string[];
  disabledBrandNames?: string[];
}) {
  const allowedBrands = BRANDS_BY_COMPANY_TYPE[orgCompanyType];
  const importedSet = new Set(importedBrandNames);
  const disabledSet = new Set(disabledBrandNames);
  let filtered = groupByBrand(presets);

  if (allowedBrands) {
    filtered = filtered.filter((b) => allowedBrands.includes(b.brandName));
  }

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
      <CardContent className="space-y-8">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Энэ төрлийн байгууллагад тохирсон брэнд загварууд тун удахгүй...
          </p>
        ) : (
          filtered.map((brand) => (
            <BrandSection
              key={brand.brandName}
              brand={brand}
              initiallyImported={importedSet.has(brand.brandName)}
              initiallyDisabled={disabledSet.has(brand.brandName)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BrandSection({
  brand,
  initiallyImported,
  initiallyDisabled,
}: {
  brand: {
    brandName: string;
    logoUrl: string | null;
    products: Preset[];
    count: number;
  };
  initiallyImported?: boolean;
  initiallyDisabled?: boolean;
}) {
  const router = useRouter();
  const [imported, setImported] = useState(initiallyImported ?? false);
  const [disabled, setDisabled] = useState(initiallyDisabled ?? false);

  const importMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("brand_name", brand.brandName);
      return importBrandPresets(formData);
    },
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        setImported(true);
        toast.success(
          `${brand.brandName} брэндийн ${result?.count ?? brand.count} бүтээгдэхүүн амжилттай импортлогдлоо.`,
        );
      }
    },
    onError: () => {
      toast.error("Импортлоход алдаа гарлаа.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const fd = new FormData();
      fd.append("brand_name", brand.brandName);
      fd.append("enabled", String(enabled));
      return toggleBrandPreset(undefined, fd);
    },
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        setDisabled(!disabled);
        router.refresh();
      }
    },
    onError: () => {
      toast.error("Тохиргоог хадгалахад алдаа гарлаа.");
    },
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.brandName}
              className={`size-8 rounded object-contain ${disabled ? "opacity-50" : ""}`}
            />
          ) : (
            <div className={`flex size-8 items-center justify-center rounded text-xs font-bold ${disabled ? "bg-muted/50 text-muted-foreground/50" : "bg-muted text-muted-foreground"}`}>
              {brand.brandName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-base font-medium">{brand.brandName}</h3>
            <p className="text-xs text-muted-foreground">
              {brand.count} бүтээгдэхүүн
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Switch
              checked={!disabled}
              onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              disabled={toggleMutation.isPending}
            />
            {disabled ? "Нуусан" : "Харагдах"}
          </label>
          {imported ? (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-500">
              <Check className="size-4" />
              Импортлосон
            </span>
          ) : (
            <Button
              size="sm"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending || disabled}
            >
              {importMutation.isPending ? (
                <>
                  <Spinner className="size-4 animate-spin" />
                  Импортлож байна...
                </>
              ) : (
                "Бүгдийг импортлох"
              )}
            </Button>
          )}
        </div>
      </div>

      {!disabled && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бүтээгдэхүүн</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Ангилал</TableHead>
                <TableHead>Өртөг ₮</TableHead>
                <TableHead>Зарах ₮</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brand.products.map((p) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
