import { capture } from "@zuiio/capture";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductsPageClient } from "./products-page-client";

export type PublicProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  category_name: string | null;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
  attribute_count: number;
};

export type OrgMeta = {
  name: string;
  slug: string;
  currency: string;
  companyType: string;
};

export type PublicProductsData = {
  organization: OrgMeta;
  products: PublicProduct[];
};

export type PublicCategory = {
  id: string;
  name: string;
  product_count: number;
};

export default function PublicProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsDataFetcher params={params} />
    </Suspense>
  );
}

async function ProductsDataFetcher({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    const [{ data: productsData, error: prodError }, { data: categoriesData }] =
      await Promise.all([
        supabase.rpc("get_public_products", { p_slug: slug }),
        supabase.rpc("get_public_categories", { p_slug: slug }),
      ]);

    if (prodError) {
      capture(prodError, { context: "public products: rpc" });
      notFound();
    }

    if (!productsData) {
      notFound();
    }

    const { organization, products } =
      productsData as unknown as PublicProductsData;
    const categories = (categoriesData ?? []) as unknown as PublicCategory[];

    return (
      <ProductsPageClient
        organization={organization}
        products={products}
        categories={categories}
      />
    );
  } catch (err) {
    capture(err, { context: "public products" });
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
