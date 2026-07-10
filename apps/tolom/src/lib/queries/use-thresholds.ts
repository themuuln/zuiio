"use client";

import { useOrgMutation } from "@zuiio/query";

export const thresholdKeys = {
  all: (orgId: string) =>
    ["organizations", orgId, "inventory", "thresholds"] as const,
};

export function useSaveThreshold(orgId: string | undefined) {
  return useOrgMutation<unknown, { partId: string; minimumQuantity: number }>({
    endpoint: `/api/organizations/${orgId}/inventory/thresholds`,
    method: "POST",
    queryKey: thresholdKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({
      part_id: vars.partId,
      minimum_quantity: vars.minimumQuantity,
    }),
    successMessage: "Threshold saved",
  });
}
