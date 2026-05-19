"use server";

import { UnauthorizedError } from "@/lib/errors";
import { getDashboardStats as getDashboardStatsForOrg } from "@/lib/services/dashboard-service";
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

  return getDashboardStatsForOrg(supabase, orgId ?? "");
}
