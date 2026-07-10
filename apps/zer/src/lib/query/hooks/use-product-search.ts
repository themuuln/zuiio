"use client";

import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import type { ProductCardProduct } from "@/components/shop/product-card";
import { searchKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;
const MAX_QUERY_LENGTH = 100;

export function useProductSearch(query: string) {
  const supabase = createClient();
  const trimmed = query.toLowerCase().trim().slice(0, MAX_QUERY_LENGTH);

  return useQuery({
    queryKey: searchKeys.products(trimmed),
    queryFn: async (): Promise<ProductCardProduct[]> => {
      try {
        const { data, error } = await withDbCapture(
          "search_products",
          // @ts-expect-error -- search_products added via migration, types not yet regenerated
          supabase.rpc("search_products", {
            p_query: trimmed,
            p_limit: 50,
          }),
        );
        if (error) throw error;
        return ((data as unknown as ProductCardProduct[]) ?? []).map((p) => ({
          id: p.id as string,
          name: p.name as string,
          sale_price: p.sale_price as number | null,
          current_stock: p.current_stock as number | null,
          unit: p.unit as string | null,
          sku: p.sku as string | null,
          barcode: p.barcode as string | null,
          category_id: p.category_id as string | null,
          image_url: p.image_url as string | null,
          brand_name: p.brand_name as string | null,
          brand_logo_url: p.brand_logo_url as string | null,
        }));
      } catch {
        // Graceful degradation: return empty array so catalog-client
        // falls back to client-side filtering via the serverResults null check
        return [];
      }
    },
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    retry: 1,
    retryDelay: 500,
  });
}

export { DEBOUNCE_MS, MIN_QUERY_LENGTH };
