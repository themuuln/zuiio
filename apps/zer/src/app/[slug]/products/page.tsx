import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StorefrontCartProvider } from "@/components/storefront/cart-context";
import { getPublicCatalog, getPublicCategories } from "@/lib/public-catalog";
import { createClient } from "@/lib/supabase/server";
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

const PAGE_SIZE = 24;

export default function PublicProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
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
  const supabase = await createClient();
  const catalog = await getPublicCatalog(supabase, slug);

  if (!catalog?.organization) {
    return { title: "Каталог" };
  }

  return {
    title: `${catalog.organization.name} — Бүтээгдэхүүний каталог`,
    description: `${catalog.organization.name}-ийн бүтээгдэхүүний каталог`,
    robots: { index: true, follow: true },
  };
}

async function ProductsDataFetcher({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const search = sp.q?.trim() || undefined;
  const categoryId = sp.category || undefined;

  try {
    const [catalog, categories] = await Promise.all([
      getPublicCatalog(supabase, slug, {
        page,
        pageSize: PAGE_SIZE,
        search,
        categoryId,
      }),
      getPublicCategories(supabase, slug),
    ]);

    if (!catalog?.organization) {
      notFound();
    }

    return (
      <ProductsPageClient
        organization={{
          name: catalog.organization?.name,
          slug: catalog.organization?.slug,
          currency: catalog.organization?.currency,
          companyType: catalog.organization?.company_type,
        }}
        products={catalog.products}
        categories={categories}
        total={catalog.total}
        page={page}
        pageSize={catalog.pageSize}
        search={search ?? ""}
        categoryId={categoryId ?? ""}
      />
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
