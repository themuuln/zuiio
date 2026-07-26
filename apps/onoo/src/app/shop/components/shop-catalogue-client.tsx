"use client";

import { Search, Shirt, ShoppingBag, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { PublicEmptyState } from "@/app/components/public-empty-state";
import type { ShopProductRow } from "@/app/lib/data-shop";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCard } from "./product-card";

interface ShopCatalogueClientProps {
  products: ShopProductRow[];
}

const CATEGORIES = [
  { value: "", label: "Бүгд" },
  { value: "clothing", label: "Хувцас" },
  { value: "accessories", label: "Дагалдах хэрэгсэл" },
] as const;

export function ShopCatalogueClient({ products }: ShopCatalogueClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const filtered = useMemo(() => {
    let result = products;

    // Category filter
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Search filter
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.name_en?.toLowerCase() ?? "").includes(q),
      );
    }

    return result;
  }, [products, search, activeCategory]);

  if (products.length === 0) {
    return (
      <PublicEmptyState
        icon={ShoppingBag}
        title="Бараа байхгүй байна"
        description="Та удахгүй шинэ бүтээгдэхүүн нэмэгдэхийг хүлээнэ үү"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Бүтээгдэхүүн хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors " +
                (activeCategory === cat.value
                  ? "border-[var(--brand-sports)] bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")
              }
            >
              {cat.value === "clothing" && <Shirt className="h-3.5 w-3.5" />}
              {cat.value === "accessories" && <Tag className="h-3.5 w-3.5" />}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShoppingBag className="h-3.5 w-3.5" />
        {filtered.length} бүтээгдэхүүн
        {search && ` · "${search.trim()}"`}
        {activeCategory && (
          <Badge
            variant="secondary"
            className="ml-1 cursor-pointer text-xs"
            onClick={() => setActiveCategory("")}
          >
            {CATEGORIES.find((c) => c.value === activeCategory)?.label}
            <span className="ml-1">✕</span>
          </Badge>
        )}
      </div>

      {/* Products grid or empty filter state */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Search className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-lg font-medium">Бүтээгдэхүүн олдсонгүй</p>
          <p className="text-sm text-muted-foreground">
            Хайлтаа өөрчлөх эсвэл шүүлтүүр арилгана уу
          </p>
        </div>
      )}
    </div>
  );
}
