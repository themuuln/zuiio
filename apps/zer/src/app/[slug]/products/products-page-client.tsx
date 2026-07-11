"use client";

import {
  ArrowRight,
  BookmarkSimple,
  MagnifyingGlass,
  Package,
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

  const hasFilters = search || categoryFilter || stockFilter !== "all";

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {getCompanyTypeLabel(organization.companyType)}
              </p>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {organization.name}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">
                {products.length}
              </p>
              <p className="text-xs text-muted-foreground">бүтээгдэхүүн</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Category pills — horizontal scroll */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                !categoryFilter
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              Бүгд ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat.id ? "" : cat.id)
                }
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  categoryFilter === cat.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                {cat.name} ({cat.product_count})
              </button>
            ))}
          </div>
        )}

        {/* Search + stock filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Нэр, тайлбар хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {STOCK_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStockFilter(f.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  stockFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setStockFilter("all");
              }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Цэвэрлэх
            </button>
          )}
        </div>

        {/* Summary */}
        {hasFilters && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} бүтээгдэхүүн олдлоо
          </p>
        )}

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package className="size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Бүтээгдэхүүн олдсонгүй.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                  setStockFilter("all");
                }}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Фильтр арилгах
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 bg-card/30 py-6 text-center text-xs text-muted-foreground">
        <p>{organization.name} &middot; Нээлттэй мэдээлэл</p>
        <p className="mt-0.5">Zer ERP дэмждэг</p>
      </div>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
