"use client";

import { MagnifyingGlass, Package } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { CategoryChip } from "@/components/shop/category-chips";
import { CategoryChips } from "@/components/shop/category-chips";
import type { ProductCardProduct } from "@/components/shop/product-card";
import { ProductCard } from "@/components/shop/product-card";
import { SearchBar } from "@/components/shop/search-bar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

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
};

export function CatalogClient({ products, categories }: CatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const filteredProducts = useMemo(() => {
    let result = products;

    // Category filter
    if (selectedCategoryId) {
      result = result.filter(
        (product) => product.category_id === selectedCategoryId,
      );
    }

    // Search filter by name or SKU (case-insensitive)
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [products, searchQuery, selectedCategoryId]);

  const isEmpty = products.length === 0;
  const hasNoResults = !isEmpty && filteredProducts.length === 0;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Search bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Category chips */}
      <CategoryChips
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      {/* Content area */}
      {isEmpty ? (
        <EmptyCatalogState />
      ) : hasNoResults ? (
        <EmptySearchResults query={searchQuery} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-4 pb-20">
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
  );
}

function EmptyCatalogState() {
  return (
    <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Package className="size-6" />
        </EmptyMedia>
        <EmptyTitle>Бүтээгдэхүүн байхгүй байна</EmptyTitle>
        <EmptyDescription>
          Танай байгууллагад бүртгэлтэй бүтээгдэхүүн одоогоор байхгүй байна.
          Шинэ бүтээгдэхүүн нэмэхийн тулд Бүтээгдэхүүн хэсэгт очно уу.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <p className="text-xs text-muted-foreground">
          Бүтээгдэхүүн нэмсэний дараа энд харагдах болно.
        </p>
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
