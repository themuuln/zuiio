"use client";

import { useRealtimeMulti } from "@zuiio/realtime";
import { createClient } from "@/lib/supabase/client";
import {
  brandKeys,
  contactKeys,
  expenseKeys,
  inventoryKeys,
  productKeys,
  saleKeys,
} from "@/lib/query/keys";

/**
 * Sets up Supabase Realtime channels for key entities (products, sales, contacts,
 * expenses, brands) that invalidate the corresponding React Query caches on any
 * INSERT/UPDATE/DELETE.
 *
 * Sales changes also invalidate the inventory/stock cache.
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
        queryKeys: [saleKeys.lists(orgId!), inventoryKeys.lists(orgId!)],
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
