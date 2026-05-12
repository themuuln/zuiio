import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { orgKeys } from "./keys";

interface CurrentOrg {
  orgId: string;
  orgName: string | null;
}

interface ProfileResponse {
  id: string;
  organizationId?: string;
  organizationName?: string | null;
  data?: {
    organizationId: string;
    organizationName?: string | null;
  };
}

/**
 * Resolves the current user's organization ID from `/api/profile`.
 * Used as the prerequisite for most data queries — pass `enabled: !!orgId`.
 */
export function useCurrentOrg(): UseQueryResult<CurrentOrg | null, Error> {
  return useQuery({
    queryKey: orgKeys.current(),
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const d: ProfileResponse = await res.json();
      const id = d?.organizationId ?? d?.data?.organizationId;
      if (!id) return null;
      return {
        orgId: id,
        orgName: d?.organizationName ?? d?.data?.organizationName ?? null,
      };
    },
    staleTime: 5 * 60_000, // org doesn't change often
    retry: 1,
  });
}
