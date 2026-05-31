import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { dashboardKeys } from "./keys";

/**
 * Fetches dashboard data for the given organization and period.
 * Uses React Query for caching, dedup, retry, and stale-while-revalidate.
 *
 * `enabled: !!orgId` prevents fetching before org is loaded.
 * `staleTime: 5000` means background refetches happen at most every 5s.
 */
const fetchDashboard = createOrgQuery<DashboardData>("/reports");

export function useDashboard(
  orgId: string | undefined,
  period: string = "month",
): UseQueryResult<DashboardData, Error> {
  return useQuery({
    queryKey: dashboardKeys.summary(orgId ?? "", period),
    queryFn: () =>
      fetchDashboard(orgId!, {
        params: { type: "dashboard", period },
      }),
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}
