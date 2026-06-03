import { useMutation, useQueryClient } from "@tanstack/react-query";
import { branchKeys } from "./keys";
import type { Branch, CreateBranchParams } from "@/lib/types";

/**
 * Mutation hook for creating a new branch.
 * Follows the exact pattern of useCreateCustomer (use-wizard-data.ts:493).
 * Invalidates branchKeys.all(orgId) on success to refetch the branch list.
 */
export function useCreateBranch(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateBranchParams) => {
      if (!orgId) throw new Error("No organization ID");
      const res = await fetch(`/api/organizations/${orgId}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let json: Record<string, unknown>;
      try {
        json = await res.json();
      } catch {
        throw new Error(
          `Server returned ${res.status} ${res.statusText}. Please try again.`,
        );
      }
      if (!res.ok || json.error) {
        throw new Error(
          ((json.error as Record<string, unknown>)?.message as string) ??
            "Failed to create branch",
        );
      }
      return json.data as Branch;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: branchKeys.all(orgId),
        });
      }
    },
  });
}
