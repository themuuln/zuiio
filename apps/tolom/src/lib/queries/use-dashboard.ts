import { keepPreviousData, type UseQueryResult, useQuery } from "@tanstack/react-query";
import { createOrgQuery } from "./factory";
import { dashboardKeys } from "./keys";
import type { DashboardData } from "@/lib/types";

/**
 * Fetches dashboard data for the given organization and date range.
 * Uses React Query for caching, dedup, retry, and stale-while-revalidate.
 *
 * `enabled: !!orgId` prevents fetching before org is loaded.
 * `staleTime: 60000` means background refetches happen at most every 60s.
 */
const fetchDashboard = createOrgQuery<DashboardData>("/reports");

export type DashboardPeriod = "today" | "week" | "month" | "all";

interface UseDashboardOptions {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string | null;
  /** Preset period — enables previous-period comparison and insights on the API side. Ignored when dateFrom/dateTo are set. */
  period?: DashboardPeriod;
}

export function useDashboard(
  orgId: string | undefined,
  options: UseDashboardOptions = {},
): UseQueryResult<DashboardData, Error> {
  const { dateFrom, dateTo, branchId, period } = options;

  return useQuery({
    queryKey: dashboardKeys.summary(
      orgId ?? "",
      dateFrom && dateTo ? `${dateFrom}_${dateTo}` : (period ?? "all"),
      branchId,
    ),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }
      const params: Record<string, string> = {
        type: "dashboard",
        branch: branchId ?? "all",
      };
      if (dateFrom && dateTo) {
        params.date_from = dateFrom;
        params.date_to = dateTo;
      } else if (period) {
        params.period = period;
      }
      return fetchDashboard(orgId, { params });
    },
    enabled: !!orgId,
    staleTime: 300_000, // 5 min — realtime keeps it fresh
    // Keep previous period visible while loading new one — instant filter switching
    placeholderData: keepPreviousData,
    // No automatic retry — the UI shows a retry button via refetchDashboard().
    retry: 0,
  });
}
