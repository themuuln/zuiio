"use client";

import { FunnelSimple, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCompanyTypeLabel } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

type PublicProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  category_name: string | null;
};

type OrgMeta = {
  name: string;
  slug: string;
  currency: string;
  companyType: string;
};

const STOCK_FILTERS = [
  { value: "all", label: "Бүгд" },
  { value: "in_stock", label: "Нөөцөд" },
  { value: "low_stock", label: "Дуусах дөхсөн" },
  { value: "out_of_stock", label: "Дууссан" },
] as const;

export function ProductsPageClient({
  organization,
  products,
}: {
  organization: OrgMeta;
  products: PublicProduct[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // Derive categories from data
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of products) {
      if (p.category_name) cats.add(p.category_name);
    }
    return Array.from(cats).sort();
  }, [products]);

  // Filter products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const query = search.toLowerCase();
      if (
        query &&
        !p.name.toLowerCase().includes(query) &&
        !(p.sku ?? "").toLowerCase().includes(query) &&
        !(p.barcode ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }
      if (categoryFilter && p.category_name !== categoryFilter) return false;
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
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Branding header */}
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {getCompanyTypeLabel(organization.companyType)}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {organization.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Нийт {products.length} төрөл бүтээгдэхүүн
            {products.filter((p) => Number(p.current_stock ?? 0) > 0).length >
              0 && (
              <>
                ,{" "}
                {
                  products.filter((p) => Number(p.current_stock ?? 0) > 0)
                    .length
                }{" "}
                нь нөөцөд байгаа
              </>
            )}
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Нэр, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Ангилал бүгд</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {STOCK_FILTERS.map((f) => (
              <button
                key={f.value}
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
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setStockFilter("all");
              }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Фильтр цэвэрлэх
            </button>
          )}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <FunnelSimple className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Бүтээгдэхүүн олдсонгүй.
            </p>
            {hasFilters && (
              <button
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <Link
                key={product.id}
                href={`/${organization.slug}/products/${product.id}`}
                className="block"
              >
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-6 text-center text-xs text-muted-foreground">
        Zer ERP &middot; {organization.name} &middot; Нээлттэй мэдээлэл
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: PublicProduct }) {
  const stock = Number(product.current_stock ?? 0);
  const minStock = Number(product.min_stock ?? 0);
  const isLow = stock > 0 && stock <= minStock;
  const isOut = stock <= 0;

  return (
    <div className="rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{product.name}</h3>
          {product.sku && (
            <p className="truncate text-xs text-muted-foreground">
              SKU: {product.sku}
            </p>
          )}
        </div>
        {product.category_name && (
          <Badge variant="outline" className="shrink-0">
            {product.category_name}
          </Badge>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold tracking-tight">
          {formatCurrency(Number(product.sale_price ?? 0))}
        </span>
        <span
          className={`text-sm ${
            isOut
              ? "text-destructive"
              : isLow
                ? "text-amber-600"
                : "text-emerald-600"
          }`}
        >
          {stock} {product.unit ?? "ширхэг"}
        </span>
      </div>

      {product.barcode && (
        <p className="mt-1 text-xs text-muted-foreground">
          Barcode: {product.barcode}
        </p>
      )}
    </div>
  );
}
