import type { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardStats {
  totalWorkOrders: number;
  activeWorkOrders: number;
  totalCustomers: number;
  monthlyRevenue: number;
}

/**
 * Returns aggregate stats for the dashboard.
 * All queries are scoped to the provided organization.
 */
export async function getDashboardStats(
  supabase: SupabaseClient,
  orgId: string,
): Promise<DashboardStats> {
  const monthRange = getMonthDateRange();

  // Run all queries in parallel
  const [
    totalWorkOrdersResult,
    activeWorkOrdersResult,
    totalCustomersResult,
    monthlyInvoicePaymentsResult,
    monthlyLegacyPaymentsResult,
  ] = await Promise.all([
    // Total work orders
    orgId
      ? supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .is("deleted_at", null)
      : { count: 0, error: null },

    // Active work orders (not completed or cancelled)
    orgId
      ? supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .not("status", "in", '("Completed","Cancelled")')
      : { count: 0, error: null },

    // Total customers
    orgId
      ? supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .is("deleted_at", null)
      : { count: 0, error: null },

    // Monthly revenue (current month, from invoice_payments via invoices)
    orgId
      ? supabase
          .from("invoice_payments")
          .select("amount, invoices!inner(organization_id)")
          .eq("invoices.organization_id", orgId)
          .gte("paid_at", monthRange.start)
          .lte("paid_at", monthRange.end)
      : { data: null, error: null },
    // Also include legacy payments table (may have historical data)
    orgId
      ? supabase
          .from("payments")
          .select("amount")
          .eq("organization_id", orgId)
          .gte("paid_at", monthRange.start)
          .lte("paid_at", monthRange.end)
          .is("deleted_at", null)
      : { data: null, error: null },
  ]);

  // Sum monthly revenue from both invoice_payments and legacy payments
  let monthlyRevenue = 0;
  const invoicePayData = monthlyInvoicePaymentsResult.data ?? [];
  const legacyPayData = monthlyLegacyPaymentsResult.data ?? [];
  for (const row of invoicePayData) {
    monthlyRevenue += Number(row.amount) || 0;
  }
  for (const row of legacyPayData) {
    monthlyRevenue += Number(row.amount) || 0;
  }

  return {
    totalWorkOrders: totalWorkOrdersResult.count ?? 0,
    activeWorkOrders: activeWorkOrdersResult.count ?? 0,
    totalCustomers: totalCustomersResult.count ?? 0,
    monthlyRevenue,
  };
}

/**
 * Helper: returns start and end ISO strings for the current month.
 */
function getMonthDateRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
