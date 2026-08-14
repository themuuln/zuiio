import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { Branch } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { branchKeys } from "./keys";

const fetchBranches = createOrgQuery<Branch[]>("/branches");

export function useBranches(
  orgId: string | undefined,
): UseQueryResult<Branch[], Error> {
  return useQuery({
    queryKey: branchKeys.list(orgId ?? ""),
    queryFn: () => fetchBranches(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
