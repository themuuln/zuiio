import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { dashboardKeys } from "./keys";

/**
 * Fetches dashboard data for the given organization and date range.
 * Uses React Query for caching, dedup, retry, and stale-while-revalidate.
 *
 * `enabled: !!orgId` prevents fetching before org is loaded.
 * `staleTime: 60000` means background refetches happen at most every 60s.
 */
const fetchDashboard = createOrgQuery<DashboardData>("/reports");

interface UseDashboardOptions {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string | null;
}

export function useDashboard(
  orgId: string | undefined,
  options: UseDashboardOptions = {},
): UseQueryResult<DashboardData, Error> {
  const { dateFrom, dateTo, branchId } = options;

  return useQuery({
    queryKey: dashboardKeys.summary(
      orgId ?? "",
      dateFrom && dateTo ? `${dateFrom}_${dateTo}` : "all",
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
      }
      return fetchDashboard(orgId, { params });
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });
}
