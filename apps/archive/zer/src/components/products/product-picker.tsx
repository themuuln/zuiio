"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useState } from "react";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ProductPickerItem {
  id: string;
  name: string;
  sku?: string | null;
  sale_price?: number | null;
}

interface ProductPickerProps {
  products: ProductPickerItem[];
  value: string | null;
  onValueChange: (productId: string) => void;
  excludeIds?: Set<string>;
  placeholder?: string;
  className?: string;
}

export function ProductPicker({
  products,
  value,
  onValueChange,
  excludeIds,
  placeholder = "Бараа сонгох",
  className,
}: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedProduct = products.find((p) => p.id === value);

  const normalized = query.trim().toLowerCase();
  const available = excludeIds
    ? products.filter((p) => !excludeIds.has(p.id) || p.id === value)
    : products;
  const filtered = normalized
    ? available.filter((p) => p.name.toLowerCase().includes(normalized))
    : available;

  const handleSelect = (productId: string) => {
    onValueChange(productId);
    setQuery("");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-8 w-full items-center rounded-md border border-input bg-background px-3 text-xs transition-colors hover:bg-muted/40",
          className,
        )}
      >
        {selectedProduct ? (
          <span className="truncate font-medium">{selectedProduct.name}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>

      <DrawerLayout
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setQuery("");
            setOpen(false);
          }
        }}
        nested
        panelWidth="28rem"
      >
        <div className="flex flex-col h-full py-6 gap-4">
          {/* Search header */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Бараа хайх..."
                className="h-11 pl-9 text-base"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="flex size-9 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {query.trim()
                  ? "Бүтээгдэхүүн олдсонгүй"
                  : "Бүтээгдэхүүн байхгүй"}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product.id)}
                    className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 text-left transition-all active:scale-[0.98] hover:border-primary/30 hover:bg-accent"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/30 text-sm font-bold text-muted-foreground/30">
                      {product.name.charAt(0)}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium">
                        {product.name}
                      </span>
                      {product.sku && (
                        <span className="text-xs text-muted-foreground">
                          {product.sku}
                        </span>
                      )}
                    </div>
                    {product.sale_price != null && (
                      <span className="text-sm font-semibold text-primary">
                        {Intl.NumberFormat("mn-MN", {
                          style: "decimal",
                          maximumFractionDigits: 0,
                        }).format(product.sale_price)}
                        ₮
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerLayout>
    </>
  );
}
