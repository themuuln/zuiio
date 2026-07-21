"use client";

import {
  Barcode,
  CheckCircle,
  ClockCounterClockwise,
  Fire,
  List as ListIcon,
  MagnifyingGlass,
  Package,
  Plus,
  SquaresFour,
  XCircle,
} from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  useAggregatedLookup,
  useDebounce,
  useLocalStorage,
  useLookup,
} from "@zuiio/hooks";
import { DynamicProductCreateDrawer } from "@/lib/dynamic-drawers";
import dynamic from "next/dynamic";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { fetchProductsPage } from "@/app/(dashboard)/shop/actions";
import {
  getProductFrequency,
  useCart,
} from "@/app/(dashboard)/shop/cart-context";
import { CartPanel } from "@/components/shop/cart-panel";
import type { CategoryChip } from "@/components/shop/category-chips";
import { CategoryChips } from "@/components/shop/category-chips";
import type { ProductCardProduct } from "@/components/shop/product-card";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgSettings } from "@/lib/org-settings-context";
import { useProductSearch } from "@/lib/query/hooks/use-product-search";
import { cn } from "@/lib/utils";

const CameraScanner = dynamic(
  () => import("./camera-scanner").then((m) => m.CameraScanner),
  { ssr: false },
);

const ProductCreateDrawer = DynamicProductCreateDrawer;

/**
 * Product grid — isolated from CatalogClient so cart mutations
 * only re-render the grid, not the search bar / category chips.
 * Uses content-visibility: auto for browser-native virtualization.
 */
const ProductGrid = memo(function ProductGrid({
  products,
  selectionMode,
  viewMode = "grid",
}: {
  products: ProductCardProduct[];
  selectionMode: "grid" | "barcode" | "hybrid";
  viewMode?: "grid" | "list";
}) {
  const { items } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const cartQuantityMap = useAggregatedLookup(
    mounted ? items.filter((i) => !i.variantId) : [],
    (i) => i.productId,
    (i) => i.quantity,
  );

  return (
    <div
      className={cn(
        "gap-3",
        viewMode === "list"
          ? "flex flex-col"
          : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
      )}
    >
      {products.map((product) => (
        <div
          key={product.id}
          style={{ contentVisibility: "auto", containIntrinsicSize: "0 280px" }}
        >
          <ProductCard
            product={product}
            variant={
              viewMode === "list"
                ? "card"
                : selectionMode === "grid"
                  ? "tile"
                  : "card"
            }
            cartQuantity={cartQuantityMap.get(product.id) ?? 0}
          />
        </div>
      ))}
    </div>
  );
});

type BarcodeStatus =
  | { type: "idle" }
  | { type: "found"; productName: string }
  | { type: "not-found"; barcode: string }
  | { type: "error"; message: string };

const SKELETON_IDS = [
  "skeleton-0",
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
] as const;

type CatalogClientProps = {
  products: ProductCardProduct[];
  categories: CategoryChip[];
  /** When "grid", hides barcode scanner and shows larger product tiles for tap-to-add. */
  selectionMode?: "grid" | "barcode" | "hybrid";
  /** Whether more pages exist beyond the initial server-fetched page. */
  initialHasMore?: boolean;
  /** Organization ID for inline product creation drawer. */
  organizationId?: string;
};

export function CatalogClient({
  products: initialProducts,
  categories,
  selectionMode = "barcode",
  initialHasMore = false,
  organizationId,
}: CatalogClientProps) {
  const { addItem } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [barcodeStatus, setBarcodeStatus] = useState<BarcodeStatus>({
    type: "idle",
  });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
    "zer:shop:recent-searches",
    [],
  );

  const recordSearch = (term: string) => {
    const q = term.trim();
    if (q.length < 2) return;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((p) => p !== q)].slice(0, 8);
      return next;
    });
  };
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { trackStock } = useOrgSettings();

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const clearStatusAfterDelay = () => {
    clearTimeout(timeoutRef.current ?? undefined);
    timeoutRef.current = setTimeout(() => {
      setBarcodeStatus({ type: "idle" });
    }, 2000);
  };

  const barcodeMap = useLookup(
    initialProducts,
    (p) => p.barcode?.toLowerCase(),
    {
      skipNull: true,
    },
  );

  // Infinite scroll: load more pages from server
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["shop_products", "infinite"],
    queryFn: ({ pageParam }) => fetchProductsPage(pageParam),
    initialPageParam: initialProducts.length,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * 50 : undefined,
    initialData: {
      pages: [{ products: initialProducts, hasMore: initialHasMore }],
      pageParams: [0],
    },
  });

  const allProducts = useMemo(
    () => infiniteData?.pages.flatMap((p) => p.products) ?? initialProducts,
    [infiniteData, initialProducts],
  );

  const { data: serverResults } = useProductSearch(debouncedQuery);

  const handleBarcodeMatch = (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return false;

    const product = barcodeMap.get(trimmed.toLowerCase()) ?? undefined;
    if (product) {
      const stock = Number(product.current_stock ?? 0);
      if (trackStock && stock <= 0) {
        setBarcodeStatus({
          type: "error",
          message: `"${product.name}" дууссан байна.`,
        });
        clearStatusAfterDelay();
        return true;
      }

      addItem({
        productId: product.id,
        name: product.name,
        unitPrice: Number(product.sale_price ?? 0),
        unit: product.unit ?? "ш",
        maxStock: trackStock ? stock : Number.POSITIVE_INFINITY,
      });

      setBarcodeStatus({ type: "found", productName: product.name });
      clearStatusAfterDelay();
      return true;
    }

    setBarcodeStatus({ type: "not-found", barcode: trimmed });
    clearStatusAfterDelay();
    return false;
  };

  const handleCameraScan = (barcode: string) => {
    const product = barcodeMap.get(barcode.toLowerCase()) ?? undefined;

    if (!product) return { found: false } as const;

    const stock = Number(product.current_stock ?? 0);
    if (trackStock && stock <= 0) {
      return {
        found: false,
        error: `"${product.name}" дууссан байна.`,
      } as const;
    }

    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.sale_price ?? 0),
      unit: product.unit ?? "ш",
      maxStock: trackStock ? stock : Number.POSITIVE_INFINITY,
    });

    setBarcodeStatus({ type: "found", productName: product.name });
    setTimeout(() => {
      setIsCameraOpen(false);
      setBarcodeStatus({ type: "idle" });
    }, 1200);

    return { found: true } as const;
  };

  const filteredProducts = useMemo(() => {
    // Server-scored results when query is active (≥2 chars, debounced)
    if (serverResults && debouncedQuery.length >= 2) {
      let result = serverResults;
      if (selectedCategoryId) {
        result = result.filter(
          (product) => product.category_id === selectedCategoryId,
        );
      }
      return result;
    }

    // Fallback: client-side filter for empty/short queries (shows all products)
    let result = allProducts;
    if (selectedCategoryId) {
      result = result.filter(
        (product) => product.category_id === selectedCategoryId,
      );
    }
    return result;
  }, [serverResults, debouncedQuery, allProducts, selectedCategoryId]);

  // Frequent items: derived client-side from add frequency (persisted in localStorage).
  // Shown only in the neutral browsing state (no search, no category filter).
  const frequentProducts = useMemo(() => {
    if (debouncedQuery || selectedCategoryId) return [];
    const freq = getProductFrequency();
    const ranked = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => allProducts.find((p) => p.id === id))
      .filter((p): p is ProductCardProduct => Boolean(p));
    return ranked;
  }, [debouncedQuery, selectedCategoryId, allProducts]);

  const isEmpty = allProducts.length === 0;
  const hasNoResults = !isEmpty && filteredProducts.length === 0;

  const showStatus = barcodeStatus.type !== "idle";

  return (
    <div className="lg:flex lg:items-start lg:gap-5">
      {/* Desktop category sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-[120px] flex flex-col gap-1">
          <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ангилал
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              "rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              selectedCategoryId === null
                ? "bg-primary/10 font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Бүгд
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                selectedCategoryId === cat.id
                  ? "bg-primary/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </aside>
      {/* Left pane: search + categories + product grid */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 pb-20 lg:pb-6">
        {/* Unified search + barcode input */}
        <div className="sticky top-[52px] z-20 bg-background pb-2 pt-4">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="search"
                value={searchQuery}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (barcodeStatus.type !== "idle") {
                    setBarcodeStatus({ type: "idle" });
                    clearTimeout(timeoutRef.current ?? undefined);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (selectionMode === "grid") {
                      if (searchQuery.trim()) recordSearch(searchQuery);
                    } else if (searchQuery.trim()) {
                      handleBarcodeMatch(searchQuery);
                    }
                  }
                }}
                onPaste={(e) => {
                  if (selectionMode !== "grid") {
                    const pastedText = e.clipboardData.getData("text");
                    if (pastedText) {
                      setTimeout(() => {
                        handleBarcodeMatch(pastedText);
                        setSearchQuery("");
                      }, 0);
                    }
                  }
                }}
                placeholder={
                  selectionMode === "grid"
                    ? "Бүтээгдэхүүнээр хайх..."
                    : "Бүтээгдэхүүн, баркод, SKU-аар хайх..."
                }
                enterKeyHint={selectionMode === "grid" ? "search" : "done"}
                className={cn(
                  "h-[44px] w-full rounded-md pl-9 pr-4 text-sm",
                  "focus-visible:ring-2 focus-visible:ring-primary/20",
                  showStatus &&
                    barcodeStatus.type === "found" &&
                    "border-primary bg-primary/5",
                  showStatus &&
                    barcodeStatus.type === "not-found" &&
                    "border-border bg-muted",
                  showStatus &&
                    barcodeStatus.type === "error" &&
                    "border-destructive bg-destructive/10",
                )}
              />
            </div>
            {selectionMode !== "grid" && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsCameraOpen(true)}
                className={cn(
                  "h-[44px] w-[44px] shrink-0 rounded-md",
                  "border-2 border-dashed",
                  isCameraOpen && "ring-2 ring-primary/30",
                )}
                aria-label="Баркод скан хийх"
              >
                <Barcode className="size-5" weight="bold" />
              </Button>
            )}
          </div>
          {/* Recent searches */}
          {searchQuery === "" && recentSearches.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <ClockCounterClockwise
                className="size-3.5 shrink-0 text-muted-foreground"
                weight="bold"
              />
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchQuery(term);
                    recordSearch(term);
                  }}
                  className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {/* Status feedback */}
          {showStatus && (
            <output
              className="mt-2 flex items-center gap-2 text-sm"
              aria-live="polite"
            >
              {barcodeStatus.type === "found" && (
                <>
                  <CheckCircle className="size-4 text-primary" weight="fill" />
                  <span className="text-primary">
                    <strong>{barcodeStatus.productName}</strong> сагсанд
                    нэмэгдлээ.
                  </span>
                </>
              )}
              {barcodeStatus.type === "not-found" && (
                <>
                  <XCircle
                    className="size-4 text-muted-foreground"
                    weight="fill"
                  />
                  <span className="text-muted-foreground">
                    &ldquo;{barcodeStatus.barcode}&rdquo; баркодтой бүтээгдэхүүн
                    олдсонгүй.
                  </span>
                </>
              )}
              {barcodeStatus.type === "error" && (
                <>
                  <XCircle className="size-4 text-destructive" weight="fill" />
                  <span className="text-destructive">
                    {barcodeStatus.message}
                  </span>
                </>
              )}
            </output>
          )}
        </div>

        {/* Camera scanner overlay */}
        {isCameraOpen && (
          <CameraScanner
            onScan={handleCameraScan}
            onClose={() => setIsCameraOpen(false)}
          />
        )}

        {/* Category chips — mobile only (desktop uses sidebar) */}
        <div className="lg:hidden">
          <CategoryChips
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        </div>
        {!isEmpty && !hasNoResults && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredProducts.length === allProducts.length
                ? `${allProducts.length} бүтээгдэхүүн`
                : `${filteredProducts.length} / ${allProducts.length} бүтээгдэхүүн`}
            </p>
            <fieldset
              aria-label="Харагдах байдал"
              className="flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5"
            >
              <button
                type="button"
                aria-label="Тор харагдац"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex size-7 items-center justify-center rounded transition-colors",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <SquaresFour className="size-4" weight="bold" />
              </button>
              <button
                type="button"
                aria-label="Жагсаалт харагдац"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex size-7 items-center justify-center rounded transition-colors",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ListIcon className="size-4" weight="bold" />
              </button>
            </fieldset>
          </div>
        )}

        {/* Frequent items rail — personalized, persisted from add frequency */}
        {frequentProducts.length > 0 && (
          <section
            aria-label="Түгээмэл бараанууд"
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Fire className="size-4" weight="bold" />
              <span>Түгээмэл</span>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {frequentProducts.map((product) => (
                <div key={product.id} className="w-[200px] shrink-0">
                  <ProductCard product={product} variant="tile" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Content area */}
        {isEmpty ? (
          <EmptyCatalogState onCreateClick={() => setCreateDrawerOpen(true)} />
        ) : hasNoResults ? (
          <EmptySearchResults query={searchQuery} />
        ) : (
          <>
            <ProductGrid
              products={filteredProducts}
              selectionMode={selectionMode}
              viewMode={viewMode}
            />
            {/* Infinite scroll sentinel */}
            {hasNextPage && !serverResults && (
              <div
                ref={(el) => {
                  if (!el) return;
                  const observer = new IntersectionObserver(
                    ([entry]) => {
                      if (entry?.isIntersecting && !isFetchingNextPage) {
                        fetchNextPage();
                        observer.disconnect();
                      }
                    },
                    { rootMargin: "200px" },
                  );
                  observer.observe(el);
                }}
                className="flex justify-center py-4"
              >
                {isFetchingNextPage && (
                  <Skeleton className="h-8 w-32 rounded-lg" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right pane: persistent order panel (desktop POS) */}
      <aside
        aria-label="Захиалгын самбар"
        className="sticky top-[68px] hidden h-[calc(100dvh-84px)] w-[340px] shrink-0 lg:block xl:w-[380px]"
      >
        <CartPanel />
      </aside>

      {/* Inline product create drawer */}
      <ProductCreateDrawer
        companyType=""
        organizationId={organizationId}
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        hideTrigger
      />
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="lg:flex lg:items-start lg:gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-4 pb-20 lg:pb-6">
        {/* Skeleton search bar */}
        <Skeleton className="h-[44px] w-full rounded-lg" />

        {/* Skeleton category chips */}
        <div className="flex gap-2">
          <Skeleton className="h-[44px] w-16 rounded-full" />
          <Skeleton className="h-[44px] w-24 rounded-full" />
          <Skeleton className="h-[44px] w-20 rounded-full" />
          <Skeleton className="h-[44px] w-28 rounded-full" />
        </div>

        {/* Skeleton product grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {SKELETON_IDS.map((id) => (
            <div key={id} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-[44px] w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton order panel (desktop) */}
      <Skeleton className="hidden h-[calc(100dvh-84px)] w-[340px] shrink-0 rounded-xl lg:block xl:w-[380px]" />
    </div>
  );
}

function EmptyCatalogState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Package className="size-6" />
        </EmptyMedia>
        <EmptyTitle>Бүтээгдэхүүн байхгүй байна</EmptyTitle>
        <EmptyDescription>
          Танай байгууллагад бүртгэлтэй бүтээгдэхүүн одоогоор байхгүй байна.
          Доорх товч дээр дарж шинэ бүтээгдэхүүн нэмнэ үү.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={onCreateClick}>
          <Plus className="size-4" />
          Шинэ бүтээгдэхүүн
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function EmptySearchResults({ query }: { query: string }) {
  return (
    <Empty className="min-h-[200px] rounded-xl border border-dashed border-border bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MagnifyingGlass className="size-6" />
        </EmptyMedia>
        <EmptyTitle>Бүтээгдэхүүн олдсонгүй</EmptyTitle>
        <EmptyDescription>
          &ldquo;{query}&rdquo; төстэй бүтээгдэхүүн олдсонгүй. Хайлтаа өөрчлөн
          үзнэ үү.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
