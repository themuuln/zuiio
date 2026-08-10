"use client";

import {
  ArrowRight,
  BookmarkSimple,
  FunnelSimple,
  MagnifyingGlass,
  Package,
  ShoppingCart,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { useStorefrontCart } from "@/components/storefront/cart-context";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCompanyTypeLabel } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { OrgMeta, PublicCategory, PublicProduct } from "./page";
import { ProductDetailDrawer } from "./product-detail-drawer";

export function ProductsPageClient({
  organization,
  products,
  categories,
  total,
  page,
  pageSize,
  search,
  categoryId,
}: {
  organization: OrgMeta;
  products: PublicProduct[];
  categories: PublicCategory[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  categoryId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const { count } = useStorefrontCart();

  // Local input state drives the debounced URL update for `q`.
  const [searchInput, setSearchInput] = useState(search);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(urlSearchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, urlSearchParams],
  );

  // Debounced search — filters reset to page 1.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({
          q: searchInput.trim() || undefined,
          page: undefined,
        });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, search, updateParams]);

  const setCategory = (id: string) => {
    updateParams({ category: id || undefined, page: undefined });
  };

  const hasFilters = !!(search || categoryId);

  const clearFilters = () => {
    setSearchInput("");
    updateParams({ q: undefined, category: undefined, page: undefined });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const goToPage = (target: number) => {
    const clamped = Math.min(Math.max(target, 1), totalPages);
    if (clamped === page) return;
    updateParams({ page: clamped === 1 ? undefined : String(clamped) });
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
              {/* Cart link */}
              <Link
                href={`/${organization.slug}/cart`}
                aria-label={`Сагс (${count})`}
                className="relative flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ShoppingCart className="size-4" />
                <span className="hidden sm:inline">Сагс</span>
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                    {count}
                  </span>
                )}
              </Link>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">{total}</p>
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
              search={searchInput}
              setSearch={setSearchInput}
              categoryFilter={categoryId}
              setCategoryFilter={setCategory}
              categories={categories}
              total={total}
              hasFilters={hasFilters}
              clearFilters={clearFilters}
            />
          </div>
        </div>
      )}

      {/* Main layout: sticky sidebar + grid */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-0 px-4 sm:px-6 lg:grid-cols-[15rem_1fr] lg:gap-8 lg:px-8">
        {/* Sidebar — sticky below header */}
        <aside className="hidden py-6 pr-6 lg:block lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:border-r lg:border-border/60">
          <SidebarFilters
            search={searchInput}
            setSearch={setSearchInput}
            categoryFilter={categoryId}
            setCategoryFilter={setCategory}
            categories={categories}
            total={total}
            hasFilters={hasFilters}
            clearFilters={clearFilters}
          />
        </aside>

        {/* Product grid */}
        <main className="py-6">
          {hasFilters && (
            <p className="mb-4 text-sm text-muted-foreground">
              {total} бүтээгдэхүүн олдлоо
            </p>
          )}

          {products.length === 0 ? (
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
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductDetailDrawer
                    key={product.id}
                    product={product}
                    organization={organization}
                  >
                    <ProductCard
                      product={product}
                      currency={organization.currency}
                    />
                  </ProductDetailDrawer>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center gap-2 py-8">
                <p className="text-xs text-muted-foreground tabular-nums">
                  Нийт {total} бүтээгдэхүүн
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    ← Өмнөх
                  </button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Дараах →
                  </button>
                </div>
              </div>
            </>
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
  categories,
  total,
  hasFilters,
  clearFilters,
}: {
  search: string;
  setSearch: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: PublicCategory[];
  total: number;
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
              <span className="text-xs tabular-nums">{total}</span>
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
          <AddToCartButton
            size="sm"
            item={{
              productId: product.id,
              name: product.name,
              unitPrice: Number(product.sale_price ?? 0),
              unit: product.unit ?? "ширхэг",
              maxStock: Number.POSITIVE_INFINITY,
            }}
          />
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
