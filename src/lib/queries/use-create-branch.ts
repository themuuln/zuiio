import type { Branch, CreateBranchParams } from "@/lib/types";
import { branchKeys } from "./keys";
import { useOrgMutation } from "@zuiio/query";

/**
 * Mutation hook for creating a new branch.
 */
export function useCreateBranch(orgId: string | undefined) {
  return useOrgMutation<Branch, CreateBranchParams>({
    endpoint: `/api/organizations/${orgId}/branches`,
    method: "POST",
    queryKey: branchKeys.all(orgId ?? ""),
  });
}
