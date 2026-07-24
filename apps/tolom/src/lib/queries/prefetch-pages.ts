import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";
import { subMonths } from "date-fns";
import { getCustomers } from "@/lib/services/customer-service";
import { getEstimates } from "@/lib/services/estimate-service";
import { getExpenses } from "@/lib/services/expense-service";
import { getPartsCatalog } from "@/lib/services/inventory-service";
import { getPurchaseOrders } from "@/lib/services/purchase-order-service";
import { getWorkOrders } from "@/lib/services/work-order-service";
import type { DashboardData } from "@/lib/types";
import {
  customerKeys,
  dashboardKeys,
  estimateKeys,
  expenseKeys,
  inventoryKeys,
  reportKeys,
  workOrderKeys,
} from "./keys";

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
    queryClient.setQueryData([...workOrderKeys.list(orgId), "", "all"], data);
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
    queryClient.setQueryData([...customerKeys.list(orgId), "all"], result.data);
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
    queryClient.setQueryData(inventoryKeys.purchaseOrders(orgId), result.data);
  } catch {
    // Non-critical
  }
}

/**
 * Server-side prefetch for the estimates list page.
 * Seeds the default unfiltered list.
 */
export async function prefetchEstimates(
  supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const result = await getEstimates(supabase, orgId);
    // Match the key used by useEstimates() with default params:
    // estimateKeys.list(orgId, undefined, "", null)
    queryClient.setQueryData(
      estimateKeys.list(orgId, undefined, "", null),
      result.data,
    );
  } catch {
    // Non-critical — client-side fetch picks up on mount
  }
}

/**
 * Server-side prefetch for the overview (dashboard) page.
 * Seeds the default "all-time" dashboard summary with no branch filter.
 */
export async function prefetchOverview(
  _supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
      "http://localhost:3000";
    const url = new URL(`/api/organizations/${orgId}/reports`, baseUrl);
    url.searchParams.set("type", "dashboard");
    url.searchParams.set("branch", "all");
    url.searchParams.set("period", "all");
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    if (!json.error && json.data) {
      // Match the key used by useDashboard() with default params
      queryClient.setQueryData(
        dashboardKeys.summary(orgId, "all", null),
        json.data as DashboardData,
      );
    }
  } catch {
    // Non-critical — client-side fetch picks up on mount
  }
}

/**
 * Server-side prefetch for the finance page.
 * Seeds the dashboard summary with the default 3-month date range and no branch filter.
 */
export async function prefetchFinance(
  _supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    const dateFrom = threeMonthsAgo.toISOString().split("T")[0];
    const dateTo = today.toISOString().split("T")[0];
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
      "http://localhost:3000";
    const url = new URL(`/api/organizations/${orgId}/reports`, baseUrl);
    url.searchParams.set("type", "dashboard");
    url.searchParams.set("branch", "all");
    url.searchParams.set("date_from", dateFrom);
    url.searchParams.set("date_to", dateTo);
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    if (!json.error && json.data) {
      // Match the key used by useDashboard() with default 3-month date range
      queryClient.setQueryData(
        dashboardKeys.summary(orgId, `${dateFrom}_${dateTo}`, null),
        json.data as DashboardData,
      );
    }
  } catch {
    // Non-critical — client-side fetch picks up on mount
  }
}

/**
 * Server-side prefetch for the reports page.
 * Seeds the daily report and supporting queries with default "today" date.
 */
export async function prefetchReports(
  _supabase: SupabaseClient,
  queryClient: QueryClient,
  orgId: string,
) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
      "http://localhost:3000";

    // Prefetch main daily report
    {
      const url = new URL(`/api/organizations/${orgId}/reports`, baseUrl);
      url.searchParams.set("type", "daily");
      url.searchParams.set("branch", "all");
      url.searchParams.set("date", today);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (!json.error && json.data) {
        const paramKey = JSON.stringify({
          type: "daily",
          branch: "all",
          date: today,
        });
        queryClient.setQueryData(
          reportKeys.summary(orgId, "daily", paramKey, null),
          json.data,
        );
      }
    }

    // Prefetch mechanics list
    {
      const url = new URL(`/api/organizations/${orgId}/reports`, baseUrl);
      url.searchParams.set("type", "mechanics");
      url.searchParams.set("branch", "all");
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (!json.error && json.data) {
        queryClient.setQueryData(reportKeys.mechanics(orgId, null), json.data);
      }
    }

    // Prefetch finance summary (month)
    {
      const url = new URL(`/api/organizations/${orgId}/reports`, baseUrl);
      url.searchParams.set("type", "finance-summary");
      url.searchParams.set("period", "month");
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (!json.error && json.data) {
        queryClient.setQueryData(
          reportKeys.summary(orgId, "finance-summary", "month"),
          json.data,
        );
      }
    }
  } catch {
    // Non-critical — client-side fetch picks up on mount
  }
}
