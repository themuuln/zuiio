"use client";

import { useRealtimeMulti } from "@zuiio/realtime";
import {
  brandKeys,
  contactKeys,
  expenseKeys,
  productKeys,
  saleKeys,
} from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

/**
 * Sets up Supabase Realtime channels for key entities (products, sales, contacts,
 * expenses, brands) that invalidate the corresponding React Query caches on any
 * INSERT/UPDATE/DELETE.
 *
 * Stock decrements from sales are handled by the products channel (the sale
 * writes to products.current_stock via the process_shop_sale RPC), so the sales
 * entry no longer needs to invalidate inventory keys.
 *
 * Cleans up all channels when the component unmounts or orgId changes.
 *
 * Pass `null` or `undefined` for orgId to skip subscription setup
 * (e.g., when the user hasn't created an organization yet).
 */
export function useRealtimeSubscriptions(orgId: string | null | undefined) {
  const supabase = createClient();

  useRealtimeMulti({
    supabase,
    enabled: !!orgId,
    tables: [
      {
        table: "products",
        queryKeys: [productKeys.lists(orgId!)],
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "sales",
        queryKeys: [saleKeys.lists(orgId!)],
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "contacts",
        queryKeys: [contactKeys.lists(orgId!)],
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "expenses",
        queryKeys: [expenseKeys.lists(orgId!)],
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "brands",
        queryKeys: [brandKeys.lists(orgId!)],
        filter: `organization_id=eq.${orgId}`,
      },
    ],
  });
}
