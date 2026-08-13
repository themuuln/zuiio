"use client";

import { ArrowLeft, Heart, Package } from "@phosphor-icons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { StorefrontCartProvider } from "@/components/storefront/cart-context";
import { useStorefrontBase } from "@/components/storefront/storefront-base-provider";
import {
  useWishlist,
  WishlistProvider,
} from "@/components/storefront/wishlist-context";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { OrgMeta, PublicProduct } from "../products/page";
import { ProductDetailDrawer } from "../products/product-detail-drawer";
import { ProductCard } from "../products/products-page-client";

// Static keys for the loading-skeleton grid (no array-index keys).
const SKELETON_KEYS = Array.from(
  { length: 6 },
  (_, i) => `wishlist-skeleton-${i + 1}`,
);

export default function WishlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <StorefrontCartProvider>
      <WishlistProvider slug={slug}>
        <WishlistApp slug={slug} />
      </WishlistProvider>
    </StorefrontCartProvider>
  );
}

/**
 * Wishlist surface: fetches the saved product ids through get_public_products
 * with p_product_ids (client-side rpc) and renders the standard cards.
 */
export function WishlistApp({ slug }: { slug: string }) {
  const { items, count } = useWishlist();
  const base = useStorefrontBase();
  const [products, setProducts] = useState<PublicProduct[] | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgCurrency, setOrgCurrency] = useState("");
  const [loadError, setLoadError] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (items.length === 0) {
      setProducts([]);
      return;
    }
    setLoadError(false);
    setProducts(null);
    // p_product_ids landed in the backend migration ahead of the generated
    // types snapshot — call through the untyped client until types
    // regenerate (repo pattern for new RPC args).
    const supabase = createClient() as SupabaseClient;
    const { data, error } = await supabase.rpc("get_public_products", {
      p_slug: slug,
      p_product_ids: items,
      p_page: 1,
      p_page_size: 100,
    });
    if (error || !data) {
      setLoadError(true);
      return;
    }
    const result = data as {
      organization: {
        name: string | null;
        currency: string | null;
      } | null;
      products: PublicProduct[];
    };
    setOrgName(result.organization?.name ?? null);
    setOrgCurrency(result.organization?.currency ?? "");
    setProducts(result.products ?? []);
  }, [items, slug]);

  useEffect(() => {
    void fetchWishlist();
  }, [fetchWishlist]);

  const organization: OrgMeta = {
    name: orgName ?? slug,
    slug,
    currency: orgCurrency,
    companyType: "",
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Link
                href={`${base}/products`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Бүтээгдэхүүн
              </Link>
              <span className="text-muted-foreground">/</span>
              <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
                <Heart className="size-5 text-primary" weight="fill" />
                Хадгалсан бүтээгдэхүүн
              </h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">{count}</p>
              <p className="text-xs text-muted-foreground">хадгалсан</p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Heart className="size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Хадгалсан бүтээгдэхүүн байхгүй
            </p>
            <Link
              href={`${base}/products`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Бүтээгдэхүүн үзэх
            </Link>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package className="size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Бүтээгдэхүүн ачааллахад алдаа гарлаа.
            </p>
            <button
              type="button"
              onClick={() => void fetchWishlist()}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Дахин оролдох
            </button>
          </div>
        ) : products === null ? (
          <div className="grid grid-cols-2 gap-3 py-6 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {SKELETON_KEYS.slice(0, Math.min(count, 6)).map((key) => (
              <div
                key={key}
                className="aspect-[4/5] animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package className="size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Хадгалсан бүтээгдэхүүн байхгүй
            </p>
            <Link
              href={`${base}/products`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Бүтээгдэхүүн үзэх
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="group">
                <ProductDetailDrawer
                  product={product}
                  organization={organization}
                >
                  <ProductCard
                    product={product}
                    currency={organization.currency}
                  />
                </ProductDetailDrawer>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="border-t border-border/60 bg-card/30 py-6 text-center text-xs text-muted-foreground">
        <p>{organization.name} &middot; Нээлттэй мэдээлэл</p>
        <p className="mt-0.5">Zer ERP дэмждэг</p>
      </div>
    </div>
  );
}
