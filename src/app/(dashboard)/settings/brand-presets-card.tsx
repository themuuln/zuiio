"use client";

import { Check, Spinner, Cube } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importBrandPresets } from "./actions";

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

export function BrandPresetsCard({ presets }: { presets: Preset[] }) {
  const brands = groupByBrand(presets);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cube className="size-5" />
          Брэнд загварууд
        </CardTitle>
        <CardDescription>
          Фитнес спорт клубт тохирсон бэлэн брэнд, бүтээгдэхүүний загваруудыг
          нэг дор импортлох
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {brands.map((brand) => (
          <BrandSection key={brand.brandName} brand={brand} />
        ))}
      </CardContent>
    </Card>
  );
}

function BrandSection({
  brand,
}: {
  brand: {
    brandName: string;
    logoUrl: string | null;
    products: Preset[];
    count: number;
  };
}) {
  const [imported, setImported] = useState(false);

  const mutation = useMutation({
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

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.brandName}
              className="size-8 rounded object-contain"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
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
        {imported ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-500">
            <Check className="size-4" />
            Импортлосон
          </span>
        ) : (
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
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
    </div>
  );
}
