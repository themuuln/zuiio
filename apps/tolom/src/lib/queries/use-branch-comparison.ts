import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { BranchComparisonData } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { dashboardKeys } from "./keys";

const fetchBranchComparison = createOrgQuery<BranchComparisonData>("/reports");

/**
 * Fetches cross-branch KPI comparison data.
 * Used by dashboard and reports for the branch comparison view.
 */
export function useBranchComparison(
  orgId: string | undefined,
  dateFrom: string,
  dateTo: string,
  enabled: boolean = true,
): UseQueryResult<BranchComparisonData, Error> {
  return useQuery({
    queryKey: dashboardKeys.branchComparison(orgId ?? "", dateFrom, dateTo),
    queryFn: async () => {
      if (!orgId) throw new Error("Organization is required");
      return fetchBranchComparison(orgId, {
        params: {
          type: "branch-comparison",
          date_from: dateFrom,
          date_to: dateTo,
        },
      });
    },
    enabled: !!orgId && enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
