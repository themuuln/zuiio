/**
 * Data layer for shop product catalog.
 * Public-facing helpers reading from the curated v_public_shop_products view.
 * All mutations go through cmd_* database commands with server-side price authority.
 */

import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/errors";

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
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all publicly available shop products from v_public_shop_products.
 * Returns an empty array on error.
 */
export async function getShopProducts(): Promise<ShopProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_shop_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    captureError("getShopProducts", error);
    return [];
  }

  return data as ShopProductRow[];
}

/**
 * Fetch a single shop product by its URL slug from v_public_shop_products.
 * Returns null if no product matches the slug or on error.
 */
export async function getShopProductBySlug(
  slug: string,
): Promise<ShopProductRow | null> {
  const supabase = await createClient();
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
}
