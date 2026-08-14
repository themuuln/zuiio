"use client";

import { MagnifyingGlass, Package } from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatCurrency } from "@/lib/format";
import type { PosProduct } from "@/lib/pos";
import { cn } from "@/lib/utils";

export type PosCategory = { id: string; name: string };

/**
 * Touch product catalog for the register: search (text + barcode + sku),
 * category chips, and a tappable tile grid. Tapping a variant product
 * opens the variant dialog instead of adding directly.
 */
export function PosProductGrid({
  products,
  categories,
  onAdd,
  onOpenVariants,
}: {
  products: PosProduct[];
  categories: PosCategory[];
  onAdd: (product: PosProduct) => void;
  onOpenVariants: (product: PosProduct) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryId && product.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        (product.barcode ?? "").toLowerCase().includes(q) ||
        (product.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [categoryId, products, search]);

  /** Enter in the search box taps the first visible product. */
  const handleSearchEnter = () => {
    const first = filtered[0];
    if (!first) return;
    if (first.has_variants) {
      onOpenVariants(first);
    } else {
      onAdd(first);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearchEnter();
            }}
            placeholder="Хайх (нэр, баркод, SKU)…"
            className="h-11 rounded-xl pl-9 text-base"
            aria-label="Бүтээгдэхүүн хайх"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Ангилал"
        >
          <Button
            type="button"
            size="sm"
            variant={categoryId === null ? "default" : "outline"}
            onClick={() => setCategoryId(null)}
            className="h-9 shrink-0 rounded-full px-4"
            aria-pressed={categoryId === null}
          >
            Бүгд
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={categoryId === category.id ? "default" : "outline"}
              onClick={() => setCategoryId(category.id)}
              className="h-9 shrink-0 rounded-full px-4"
              aria-pressed={categoryId === category.id}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
          <Package className="size-8" />
          <p className="text-sm">Бүтээгдэхүүн олдсонгүй</p>
        </div>
      ) : (
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto pb-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((product) => {
            const outOfStock =
              product.current_stock !== null && product.current_stock <= 0;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() =>
                  product.has_variants
                    ? onOpenVariants(product)
                    : onAdd(product)
                }
                disabled={outOfStock}
                className={cn(
                  "group flex min-h-28 flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-colors",
                  "hover:border-primary/50 focus-visible:border-primary/60 focus-visible:outline-none",
                  outOfStock && "cursor-not-allowed opacity-50",
                )}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                  {product.image_url ? (
                    <OptimizedImage
                      src={product.image_url}
                      alt={product.name}
                      width={160}
                      aspectRatio="4/3"
                      className="h-full w-full"
                      imgClassName="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="size-6 text-muted-foreground/60" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 p-2">
                  <p className="line-clamp-2 text-xs leading-tight font-medium">
                    {product.name}
                  </p>
                  <p className="mt-auto text-sm font-semibold">
                    {formatCurrency(product.sale_price ?? 0)}
                  </p>
                  {product.current_stock !== null && (
                    <Badge
                      variant={outOfStock ? "destructive" : "secondary"}
                      className="w-fit px-1.5 py-0 text-[10px]"
                    >
                      {outOfStock
                        ? "Дууссан"
                        : `Нөөц: ${product.current_stock}`}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
