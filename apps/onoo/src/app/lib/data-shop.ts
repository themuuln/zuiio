/**
 * Data layer for shop product catalog.
 * Public-facing helpers reading from the curated v_public_shop_products view.
 * All mutations go through cmd_* database commands with server-side price authority.
 */

import { cacheLife } from "next/cache";
import { cache } from "react";
import { captureError } from "@/lib/errors";
import { createPublicClient } from "@/lib/supabase/public";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShopProductVariant {
  size: string;
  stock: number;
}

export interface ShopProductRow {
  id: string;
  name: string;
  slug: string;
  price_mnt: number;
  images: string[];
  variants: ShopProductVariant[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
  name_en?: string;
  description?: string;
  category?: string;
  // Team connection
  team_id?: string | null;
  team_name?: string | null;
  team_slug?: string | null;
  team_primary_color?: string | null;
  team_short_code?: string | null;
}

export interface ProductReview {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
}

export interface ProductBundle {
  id: string;
  name: string;
  description?: string | null;
  discount_percent: number;
  items: ShopProductRow[];
  total_original: number;
  total_discounted: number;
}

// ---------------------------------------------------------------------------
// Query helpers — Products
// ---------------------------------------------------------------------------

/**
 * Fetch all publicly available shop products from v_public_shop_products.
 * Cached cross-request via "use cache" — product data changes infrequently.
 */
export const getShopProducts = cache(async (): Promise<ShopProductRow[]> => {
  "use cache";
  cacheLife("standard");
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("v_public_shop_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    captureError("getShopProducts", error);
    return [];
  }

  return data as ShopProductRow[];
});

/**
 * Fetch related products (same category, excluding current slug).
 * Falls back to most recent products when no category is set.
 * Returns up to 4 products.
 */
export const getRelatedProducts = cache(
  async (
    currentSlug: string,
    category?: string | null,
  ): Promise<ShopProductRow[]> => {
    const supabase = createPublicClient();
    const query = supabase
      .from("v_public_shop_products")
      .select("*")
      .neq("slug", currentSlug);

    if (category) {
      query.eq("category", category);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(4);

    if (error || !data) {
      captureError("getRelatedProducts", error);
      return [];
    }

    return data as ShopProductRow[];
  },
);

/**
 * Fetch a single shop product by its URL slug from v_public_shop_products.
 */
export const getShopProductBySlug = cache(
  async (slug: string): Promise<ShopProductRow | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("v_public_shop_products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      captureError(`getShopProductBySlug("${slug}")`, error);
      return null;
    }

    return data as ShopProductRow;
  },
);

/**
 * Fetch products for a specific team (by team slug).
 */
export const getProductsByTeamSlug = cache(
  async (teamSlug: string): Promise<ShopProductRow[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("v_public_shop_products")
      .select("*")
      .eq("team_slug", teamSlug)
      .order("created_at", { ascending: false });

    if (error || !data) {
      captureError(`getProductsByTeamSlug("${teamSlug}")`, error);
      return [];
    }

    return data as ShopProductRow[];
  },
);

// ---------------------------------------------------------------------------
// Query helpers — Reviews
// ---------------------------------------------------------------------------

export interface ReviewWithMeta extends ProductReview {
  is_approved: boolean;
}

/**
 * Fetch approved reviews for a product.
 */
export const getProductReviews = cache(
  async (productId: string): Promise<ProductReview[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error || !data) {
      captureError(`getProductReviews("${productId}")`, error);
      return [];
    }

    return data as ProductReview[];
  },
);

/**
 * Get average rating and count for a product.
 */
export const getProductRatingSummary = cache(
  async (
    productId: string,
  ): Promise<{
    average: number;
    count: number;
    distribution: Record<number, number>;
  }> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("is_approved", true);

    if (error || !data) {
      captureError(`getProductRatingSummary("${productId}")`, error);
      return {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const count = data.length;
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    let sum = 0;

    for (const r of data) {
      distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
      sum += r.rating;
    }

    return {
      average: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
      count,
      distribution,
    };
  },
);

/**
 * Submit a product review (public anon endpoint).
 */
export async function submitProductReview(
  productId: string,
  authorName: string,
  rating: number,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    author_name: authorName,
    rating,
    content,
  });

  if (error) {
    captureError("submitProductReview", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Query helpers — Bundles
// ---------------------------------------------------------------------------

/**
 * Fetch active bundles that contain a given product.
 * Returns fully resolved bundle data including all items.
 */
export const getProductBundles = cache(
  async (productId: string): Promise<ProductBundle[]> => {
    const supabase = createPublicClient();

    // 1. Find bundle IDs containing this product
    const { data: bundleLinks, error: linkErr } = await supabase
      .from("bundle_items")
      .select("bundle_id")
      .eq("product_id", productId);

    if (linkErr || !bundleLinks?.length) return [];

    const bundleIds = [...new Set(bundleLinks.map((b) => b.bundle_id))];

    // 2. Fetch bundle metadata
    const { data: bundles, error: bundleErr } = await supabase
      .from("product_bundles")
      .select("*")
      .in("id", bundleIds)
      .eq("is_active", true);

    if (bundleErr || !bundles?.length) return [];

    // 3. Fetch all items in these bundles
    const { data: allItems, error: itemsErr } = await supabase
      .from("bundle_items")
      .select("bundle_id, product_id")
      .in("bundle_id", bundleIds);

    if (itemsErr || !allItems?.length) return [];

    const allProductIds = [...new Set(allItems.map((i) => i.product_id))];

    // 4. Fetch full product data for all items
    const { data: allProducts, error: prodErr } = await supabase
      .from("v_public_shop_products")
      .select("*")
      .in("id", allProductIds);

    if (prodErr || !allProducts) return [];

    const productMap = new Map(
      (allProducts as ShopProductRow[]).map((p) => [p.id, p]),
    );

    // 5. Assemble bundle objects
    return bundles.map((b) => {
      const items = allItems
        .filter((i) => i.bundle_id === b.id)
        .map((i) => productMap.get(i.product_id))
        .filter(Boolean) as ShopProductRow[];

      const totalOriginal = items.reduce((s, i) => s + i.price_mnt, 0);
      const totalDiscounted = Math.round(
        totalOriginal * (1 - b.discount_percent / 100),
      );

      return {
        id: b.id,
        name: b.name,
        description: b.description,
        discount_percent: b.discount_percent,
        items,
        total_original: totalOriginal,
        total_discounted: totalDiscounted,
      };
    });
  },
);
