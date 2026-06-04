import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
import type { Branch, CreateBranchParams } from "@/lib/types";
import { branchKeys } from "./keys";

/**
 * Mutation hook for creating a new branch.
 * Follows the exact pattern of useCreateCustomer (use-wizard-data.ts:493).
 * Invalidates branchKeys.all(orgId) on success to refetch the branch list.
 */
export function useCreateBranch(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  return useMutation({
    mutationFn: async (body: CreateBranchParams) => {
      if (!orgId) throw new Error("No organization ID");

      if (isOnline) {
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
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/branches`,
        method: "POST",
        body,
        queryKeysToInvalidate: [[...branchKeys.all(orgId)]],
      });
      return { queued: true } as unknown as Branch;
    },
    onSuccess: (data) => {
      const d = data as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId) {
          queryClient.invalidateQueries({
            queryKey: branchKeys.all(orgId),
          });
        }
      }
    },
  });
}
