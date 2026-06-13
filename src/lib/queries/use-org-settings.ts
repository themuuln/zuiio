import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
import type { OrgTransferBankAccount } from "@/lib/payments/org-bank-accounts";
import { toastRetry } from "@/lib/toast-utils";
import { orgKeys } from "./keys";

interface OrgSettings {
  daily_revenue_goal?: number;
  invoice_prefix?: string;
  default_currency?: string;
  default_tax_rate?: number;
  timezone?: string;
  date_format?: string;
  language?: string;
  /** Processing fee % keyed by payment method (e.g. card: 1). */
  payment_method_fees?: Partial<Record<string, number>>;
  /** Enabled transfer bank accounts for customer payments. */
  transfer_bank_accounts?: OrgTransferBankAccount[];
  [key: string]: unknown;
}

/**
 * Fetches organization settings from the API.
 * Returns the `settings` object from the organization record.
 */
export function useOrgSettings(orgId: string | undefined): {
  settings: OrgSettings | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: orgKeys.settings(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return null;
      const res = await fetch(`/api/organizations/${orgId}`);
      if (!res.ok) throw new Error("Failed to load organization settings");
      const json = await res.json();
      return (json.data?.settings ?? {}) as OrgSettings;
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: 1,
  });

  return { settings: data ?? null, isLoading, error: error as Error | null };
}

/**
 * Saves a single org setting value via PATCH /api/organizations/[id].
 * Merges into existing settings (doesn't replace them).
 */
export function useUpdateOrgSettings(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async (settings: Partial<OrgSettings>) => {
      if (!orgId) throw new Error("No organization ID");

      if (isOnline) {
        const res = await fetch(`/api/organizations/${orgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            body?.error?.message ?? `Failed to save (${res.status})`,
          );
        }
        return (await res.json()).data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}`,
        method: "PATCH",
        body: { settings },
        queryKeysToInvalidate: [[...orgKeys.settings(orgId)]],
      });
      return { queued: true } as unknown as unknown;
    },
    onSuccess: (data) => {
      const d = data as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId) {
          queryClient.invalidateQueries({ queryKey: orgKeys.settings(orgId) });
        }
        toast.dismiss();
        toast.success("Settings saved");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });
  return mutation;
}
