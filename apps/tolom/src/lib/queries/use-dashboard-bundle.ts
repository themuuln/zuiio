"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
// Re-export for convenience — consumers use one import
export type { DashboardPeriod } from "./use-dashboard";
import type { DashboardData, SubscriptionStatus } from "@/lib/types";
import { dashboardKeys } from "./keys";

export interface DashboardBundle {
  dashboard: DashboardData;
  subscription: SubscriptionStatus;
}

/**
 * Fetches all dashboard-page data in a single API call.
 * Combines KPIs, charts, recent work orders, and subscription status
 * so the page doesn't need 4+ separate requests.
 *
 * ## Migration from separate hooks
 *
 * | Before | After |
 * |--------|-------|
 * | `useDashboard(orgId, opts)` | `useDashboardBundle(orgId, opts).data.dashboard` |
 * | `useSubscription(orgId)` | `useDashboardBundle(orgId, opts).data.subscription` |
 *
 * @see /api/organizations/[id]/dashboard-bundle
 */
export function useDashboardBundle(
  orgId: string | undefined,
  options: { period?: "today" | "week" | "month" | "all"; branchId?: string | null } = {},
): UseQueryResult<DashboardBundle, Error> {
  const { period = "month", branchId = null } = options;

  return useQuery({
    queryKey: dashboardKeys.bundle(orgId ?? "", period, branchId),
    queryFn: async () => {
      if (!orgId) throw new Error("Organization is required");
      const params = new URLSearchParams({ period, branch: branchId ?? "all" });
      const res = await fetch(`/api/organizations/${orgId}/dashboard-bundle?${params}`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      const body = await res.json();
      // API handler wraps in { data: { dashboard, subscription } }
      return body.data as DashboardBundle;
    },
    enabled: !!orgId,
    staleTime: 300_000, // 5 min — realtime keeps it fresh
    retry: 0,           // UI shows retry button instead
  });
}
