"use server";

import { UnauthorizedError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  totalWorkOrders: number;
  activeWorkOrders: number;
  totalCustomers: number;
  monthlyRevenue: number;
}

/**
 * Returns aggregate stats for the dashboard.
 * All queries are scoped to the current user's organization.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  // Find the user's organization
  const { data: membership } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const orgId = membership?.organization_id;
  const monthRange = getMonthDateRange();

  // Run all queries in parallel
  const [
    totalWorkOrdersResult,
    activeWorkOrdersResult,
    totalCustomersResult,
    monthlyRevenueResult,
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

    // Monthly revenue (current month, paid invoices)
    orgId
      ? supabase
          .from("payments")
          .select("amount")
          .eq("organization_id", orgId)
          .gte("created_at", monthRange.start)
          .lte("created_at", monthRange.end)
          .is("deleted_at", null)
      : { data: null, error: null },
  ]);

  // Sum monthly revenue
  let monthlyRevenue = 0;
  if (monthlyRevenueResult.data) {
    monthlyRevenue = monthlyRevenueResult.data.reduce(
      (sum, row) => sum + (Number(row.amount) || 0),
      0,
    );
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
