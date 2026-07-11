"use client";

import {
  ArrowRight,
  BookmarkSimple,
  FunnelSimple,
  MagnifyingGlass,
  Package,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCompanyTypeLabel } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { OrgMeta, PublicCategory, PublicProduct } from "./page";

const STOCK_FILTERS = [
  { value: "all", label: "Бүгд" },
  { value: "in_stock", label: "Нөөцөд" },
  { value: "low_stock", label: "Дуусах дөхсөн" },
  { value: "out_of_stock", label: "Дууссан" },
] as const;

export function ProductsPageClient({
  organization,
  products,
  categories,
}: {
  organization: OrgMeta;
  products: PublicProduct[];
  categories: PublicCategory[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const query = search.toLowerCase();
      if (
        query &&
        !p.name.toLowerCase().includes(query) &&
        !(p.sku ?? "").toLowerCase().includes(query) &&
        !(p.description ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      const stock = Number(p.current_stock ?? 0);
      const minStock = Number(p.min_stock ?? 0);
      if (stockFilter === "in_stock" && stock <= 0) return false;
      if (stockFilter === "low_stock" && (stock <= 0 || stock > minStock))
        return false;
      if (stockFilter === "out_of_stock" && stock > 0) return false;
      return true;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const hasFilters = !!(search || categoryFilter || stockFilter !== "all");

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStockFilter("all");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {getCompanyTypeLabel(organization.companyType)}
              </p>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {organization.name}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Mobile filter toggle */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground lg:hidden"
              >
                <FunnelSimple className="size-4" />
                Шүүлтүүр
                {hasFilters && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </button>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">
                  {filtered.length}
                </p>
                <p className="text-xs text-muted-foreground">бүтээгдэхүүн</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filters overlay */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-background p-5 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold">Шүүлтүүр</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarFilters
              search={search}
              setSearch={setSearch}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              categories={categories}
              products={products}
              hasFilters={hasFilters}
              clearFilters={clearFilters}
            />
          </div>
        </div>
      )}

      {/* Main layout: sidebar + grid */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-border/60 py-6 pr-6 lg:block">
          <SidebarFilters
            search={search}
            setSearch={setSearch}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            categories={categories}
            products={products}
            hasFilters={hasFilters}
            clearFilters={clearFilters}
          />
        </aside>

        {/* Product grid */}
        <main className="flex-1 py-6">
          {hasFilters && (
            <p className="mb-4 text-sm text-muted-foreground">
              {filtered.length} бүтээгдэхүүн олдлоо
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <Package className="size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Бүтээгдэхүүн олдсонгүй.
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Фильтр арилгах
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product) => (
                <Link
                  key={product.id}
                  href={`/${organization.slug}/products/${product.id}`}
                  className="group block"
                >
                  <ProductCard
                    product={product}
                    currency={organization.currency}
                  />
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 bg-card/30 py-6 text-center text-xs text-muted-foreground">
        <p>{organization.name} &middot; Нээлттэй мэдээлэл</p>
        <p className="mt-0.5">Zer ERP дэмждэг</p>
      </div>
    </div>
  );
}

function SidebarFilters({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  categories,
  products,
  hasFilters,
  clearFilters,
}: {
  search: string;
  setSearch: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  stockFilter: string;
  setStockFilter: (v: string) => void;
  categories: PublicCategory[];
  products: PublicProduct[];
  hasFilters: boolean;
  clearFilters: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Хайх</p>
        <div className="relative">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Нэр, тайлбар..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Ангилал
          </p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                !categoryFilter
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>Бүгд</span>
              <span className="text-xs tabular-nums">{products.length}</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat.id ? "" : cat.id)
                }
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  categoryFilter === cat.id
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span className="shrink-0 text-xs tabular-nums">
                  {cat.product_count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock filter */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Нөөц</p>
        <div className="space-y-0.5">
          {STOCK_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStockFilter(f.value)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                stockFilter === f.value
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          Цэвэрлэх
        </button>
      )}
    </div>
  );
}

function ProductCard({
  product,
  currency,
}: {
  product: PublicProduct;
  currency: string;
}) {
  const stock = Number(product.current_stock ?? 0);
  const minStock = Number(product.min_stock ?? 0);
  const isLow = stock > 0 && stock <= minStock;
  const isOut = stock <= 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-all group-hover:shadow-md group-hover:border-primary/30">
      {/* Image area */}
      {product.image_url ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {/* biome-ignore lint/performance/noImgElement: Supabase storage URLs */}
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {product.attribute_count > 0 && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                <BookmarkSimple className="size-3" />
                Зөвлөмж
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-muted/50">
          <Package className="size-10 text-muted-foreground/20" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium leading-tight">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold tracking-tight tabular-nums">
              {formatCurrency(Number(product.sale_price ?? 0))}
            </p>
            {currency && (
              <p className="text-[10px] text-muted-foreground">{currency}</p>
            )}
          </div>
          <div className="text-right">
            {isOut ? (
              <Badge variant="destructive" className="text-[10px]">
                Дууссан
              </Badge>
            ) : isLow ? (
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-600 text-[10px]"
              >
                {stock} үлдсэн
              </Badge>
            ) : (
              <span className="text-xs text-emerald-600 font-medium">
                {stock} {product.unit ?? "ширхэг"}
              </span>
            )}
          </div>
        </div>

        {/* View details hint */}
        <div className="flex items-center gap-1 pt-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Дэлгэрэнгүй
          <ArrowRight className="size-3" />
        </div>
      </div>
    </div>
  );
}
