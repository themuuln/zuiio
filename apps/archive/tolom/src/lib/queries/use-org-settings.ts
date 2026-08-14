import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import type { OrgTransferBankAccount } from "@/lib/payments/org-bank-accounts";
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
  return useOrgMutation<unknown, Partial<OrgSettings>>({
    endpoint: `/api/organizations/${orgId}`,
    method: "PATCH",
    queryKey: orgKeys.settings(orgId ?? ""),
    successMessage: "Settings saved",
  });
}
