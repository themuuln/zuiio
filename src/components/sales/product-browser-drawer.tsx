"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductItem = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  barcode: string | null;
  image_url: string | null;
};

export function ProductBrowserDrawer({
  open,
  onOpenChange,
  products,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductItem[];
  onSelect: (product: ProductItem) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const lowered = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowered) ||
        (p.barcode && p.barcode.toLowerCase().includes(lowered)),
    );
  }, [products, query]);

  const handleSelect = (product: ProductItem) => {
    onSelect(product);
    setQuery("");
    onOpenChange(false);
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        onOpenChange(next);
      }}
      nested
      panelWidth="100%"
      className="!max-w-full"
    >
      <div className="flex flex-col h-full">
        {/* Header with search */}
        <div className="mb-4 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Бүтээгдэхүүн хайх..."
              className="h-11 pl-9 text-base"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onOpenChange(false);
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              <p>Бүтээгдэхүүн олдсонгүй</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
              {filtered.map((product) => {
                const stock = Number(product.current_stock ?? 0);
                const isOutOfStock = stock <= 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 text-left transition-all active:scale-[0.98]",
                      isOutOfStock && "opacity-50",
                    )}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/30 text-lg font-bold text-muted-foreground/30">
                      {product.name.charAt(0)}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <span className="truncate text-xs font-medium">
                        {product.name}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(Number(product.sale_price ?? 0))}
                      </span>
                      {!isOutOfStock && (
                        <span className="text-[10px] text-muted-foreground">
                          {stock} {product.unit ?? "ширхэг"} үлдэгдэл
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="text-[10px] text-destructive">
                          Дууссан
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DrawerLayout>
  );
}
