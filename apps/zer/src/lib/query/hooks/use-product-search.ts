"use client";

import { useRpcSearch } from "@zuiio/search";
import type { ProductCardProduct } from "@/components/shop/product-card";
import { createClient } from "@/lib/supabase/client";

const mapToProduct = (row: Record<string, unknown>): ProductCardProduct => ({
  id: row.id as string,
  name: row.name as string,
  sale_price: row.sale_price as number | null,
  current_stock: row.current_stock as number | null,
  unit: row.unit as string | null,
  sku: row.sku as string | null,
  barcode: row.barcode as string | null,
  category_id: row.category_id as string | null,
  image_url: row.image_url as string | null,
  brand_name: row.brand_name as string | null,
  brand_logo_url: row.brand_logo_url as string | null,
});

/**
 * Zer-specific product search hook.
 * Thin wrapper around useRpcSearch from @zuiio/search.
 */
export function useProductSearch(query: string) {
  const supabase = createClient();

  return useRpcSearch<ProductCardProduct>(query, {
    supabase,
    rpcFunction: "search_products",
    mapResult: mapToProduct,
  });
}
