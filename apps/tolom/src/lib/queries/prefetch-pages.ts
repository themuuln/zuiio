import { type QueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { customerKeys, expenseKeys, inventoryKeys, workOrderKeys } from "./keys";
import { getCustomers } from "@/lib/services/customer-service";
import { getExpenses } from "@/lib/services/expense-service";
import { getPartsCatalog } from "@/lib/services/inventory-service";
import { getPurchaseOrders } from "@/lib/services/purchase-order-service";
import { getWorkOrders } from "@/lib/services/work-order-service";

/**
 * Server-side prefetch for the work orders list page.
 * Seeds the default unfiltered view so the table renders immediately
 * before any status/search/branch filters are applied.
 *
 * Call from the page server component (which must be async):
 *   const queryClient = new QueryClient();
 *   const supabase = await createClient();
 *   await prefetchWorkOrders(supabase, queryClient, orgId);
 *   return <HydrationBoundary state={dehydrate(queryClient)}>...</>
 */
export async function prefetchWorkOrders(
  supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const data = await getWorkOrders(supabase, orgId);
    // Match the key used by useWorkOrders() with default params:
    // [...workOrderKeys.list(orgId, ""), "", "all"]
    queryClient.setQueryData(
      [...workOrderKeys.list(orgId), "", "all"],
      data,
    );
  } catch {
    // Non-critical — client-side fetch picks up on mount
  }
}

/**
 * Server-side prefetch for the inventory page parts catalog.
 */
export async function prefetchInventory(
  supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const data = await getPartsCatalog(supabase, orgId);
    // Match the key used by usePartsCatalog()
    queryClient.setQueryData(inventoryKeys.parts(orgId), data);
  } catch {
    // Non-critical
  }
}

/**
 * Server-side prefetch for the customers list page.
 * Seeds the default unfiltered list.
 */
export async function prefetchCustomers(
  supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const result = await getCustomers(supabase, orgId);
    // Match the key used by useCustomers() with default params:
    // [...customerKeys.list(orgId, ""), "all"]
    queryClient.setQueryData(
      [...customerKeys.list(orgId), "all"],
      result.data,
    );
  } catch {
    // Non-critical
  }
}

/**
 * Server-side prefetch for the expenses list page.
 * Seeds the default unfiltered list.
 */
export async function prefetchExpenses(
  supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const data = await getExpenses(supabase, orgId);
    // Match the key used by useExpenses() with default params
    queryClient.setQueryData(expenseKeys.list(orgId), data);
  } catch {
    // Non-critical
  }
}

/**
 * Server-side prefetch for the purchase orders list page.
 * Seeds the default first page.
 */
export async function prefetchPurchaseOrders(
  supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const result = await getPurchaseOrders(supabase, orgId);
    // Match the key used by usePurchaseOrders() with default params
    queryClient.setQueryData(
      inventoryKeys.purchaseOrders(orgId),
      result.data,
    );
  } catch {
    // Non-critical
  }
}
