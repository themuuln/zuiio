import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/lib/types";
import { dashboardKeys } from "./keys";

/**
 * Fetches dashboard data for the given organization and period.
 * Uses React Query for caching, dedup, retry, and stale-while-revalidate.
 *
 * `enabled: !!orgId` prevents fetching before org is loaded.
 * `staleTime: 5000` means background refetches happen at most every 5s.
 */
export function useDashboard(
  orgId: string | undefined,
  period: string = "month",
): UseQueryResult<DashboardData, Error> {
  return useQuery({
    queryKey: dashboardKeys.summary(orgId ?? "", period),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/reports?type=dashboard&period=${period}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? `Request failed (${res.status})`,
        );
      }
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as DashboardData;
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}
