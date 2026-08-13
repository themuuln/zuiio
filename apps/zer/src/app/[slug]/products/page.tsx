import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StorefrontCartProvider } from "@/components/storefront/cart-context";
import { WishlistProvider } from "@/components/storefront/wishlist-context";
import type { PublicProductSort } from "@/lib/public-catalog";
import {
  getPublicCatalogCached,
  getPublicCategoriesCached,
  getPublicPromotionsCached,
  type StorefrontCatalogOptions,
} from "@/lib/storefront-cache";
import {
  requestHost,
  storefrontCanonical,
  storefrontSocialMetadata,
} from "@/lib/storefront-seo";
import { ProductsPageClient } from "./products-page-client";

// Types for client components — match the public catalog RPC shape exactly.
export type PublicProduct = {
  id: string;
  name: string;
  unit: string | null;
  sale_price: number | null;
  category_name: string | null;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
  attribute_count: number;
  // Extra gallery images (image_url is always the primary/first entry).
  images: Array<{ url: string | null; sort_order: number | null }> | null;
  // Only populated when the org opts in to public stock (show_stock=true),
  // otherwise NULL — privacy default preserved.
  current_stock: number | null;
  // Review stats + active promo (backend migration 2026-08-11).
  review_count: number | null;
  review_average: number | null;
  promo: {
    id: string;
    title: string;
    reward_label: string | null;
  } | null;
};

export type OrgMeta = {
  name: string;
  slug: string;
  currency: string;
  companyType: string;
};

export type PublicCategory = {
  id: string;
  name: string;
  product_count: number;
};

export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  reward_label: string | null;
  valid_from: string | null;
  valid_until: string | null;
  type: string | null;
};

const PAGE_SIZE = 24;

function parseSort(value: string | undefined): PublicProductSort | undefined {
  switch (value) {
    case "price_asc":
    case "price_desc":
    case "newest":
    case "name":
      return value;
    default:
      return undefined;
  }
}

export default function PublicProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
  }>;
}) {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <StorefrontCartProvider>
        <ProductsDataFetcher params={params} searchParams={searchParams} />
      </StorefrontCartProvider>
    </Suspense>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getPublicCatalogCached(slug);

  if (!catalog?.organization) {
    return { title: "Каталог" };
  }

  const title = `${catalog.organization.name} — Бүтээгдэхүүний каталог`;
  const description = `${catalog.organization.name}-ийн бүтээгдэхүүний каталог`;
  const canonical = storefrontCanonical(await requestHost(), slug, "/products");

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    ...storefrontSocialMetadata({
      title,
      description,
      canonical,
      siteName: catalog.organization.name,
    }),
  };
}

async function ProductsDataFetcher({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
  }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.q?.trim() || undefined;
  const categoryId = sp.category || undefined;
  // Price filters: only forward well-formed non-negative numbers.
  const minPriceRaw = sp.min_price?.trim();
  const maxPriceRaw = sp.max_price?.trim();
  const minPrice =
    minPriceRaw && Number.isFinite(Number(minPriceRaw))
      ? Math.max(0, Number(minPriceRaw))
      : undefined;
  const maxPrice =
    maxPriceRaw && Number.isFinite(Number(maxPriceRaw))
      ? Math.max(0, Number(maxPriceRaw))
      : undefined;
  const sort = parseSort(sp.sort) ?? "newest";

  try {
    const catalogOptions: StorefrontCatalogOptions = {
      page,
      pageSize: PAGE_SIZE,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sort,
    };
    const [catalog, categories, promotions] = await Promise.all([
      getPublicCatalogCached(slug, catalogOptions),
      getPublicCategoriesCached(slug),
      getPublicPromotionsCached(slug),
    ]);

    if (!catalog?.organization) {
      notFound();
    }

    return (
      <WishlistProvider slug={slug}>
        <ProductsPageClient
          organization={{
            name: catalog.organization?.name,
            slug: catalog.organization?.slug,
            currency: catalog.organization?.currency,
            companyType: catalog.organization?.company_type,
          }}
          products={catalog.products}
          categories={categories}
          promotions={promotions}
          total={catalog.total}
          page={page}
          pageSize={catalog.pageSize}
          search={search ?? ""}
          categoryId={categoryId ?? ""}
          minPrice={minPriceRaw ?? ""}
          maxPrice={maxPriceRaw ?? ""}
          sort={sort}
        />
      </WishlistProvider>
    );
  } catch {
    notFound();
  }
}

function ProductsSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        {/* Grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-border/80 bg-card p-4 shadow-sm"
            >
              <div className="mb-3 aspect-[4/3] animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted mb-2" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted mb-2" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
