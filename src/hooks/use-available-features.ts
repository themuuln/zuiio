"use client";

import { useQuery } from "@tanstack/react-query";
import {
  type FeatureKey,
  getPlanFeatures,
  isPlanFeatureEnabled,
  type PlanType,
} from "@/lib/plan-features";
import type { ApiResponse } from "@/lib/types";

interface FeatureFlag {
  id: string;
  flag_key: string;
  enabled: boolean;
  description: string | null;
}

/**
 * Combines plan-level feature availability + org-level feature flags + role
 * to determine which features the current user can access.
 */
export function useAvailableFeatures() {
  const { data: profile } = useQuery<{
    organizationId: string | null;
    roleName: string | null;
  }>({
    queryKey: ["profile", "current"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return { organizationId: null, roleName: null };
      const data = await res.json();
      return {
        organizationId:
          data.organizationId ?? data.data?.organizationId ?? null,
        roleName: data.roleName ?? data.data?.roleName ?? null,
      };
    },
    staleTime: 5 * 60_000,
  });

  const orgId = profile?.organizationId;

  // Fetch org's subscription plan
  const { data: subscription } = useQuery<{ planType: PlanType }>({
    queryKey: ["org", orgId, "subscription"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/subscription`);
      const body = (await res.json()) as ApiResponse<{ planType: PlanType }>;
      return body.data ?? { planType: "starter" };
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  // Fetch org's feature flags
  const { data: featureFlags } = useQuery<FeatureFlag[]>({
    queryKey: ["org", orgId, "features"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/features`);
      const body = (await res.json()) as ApiResponse<FeatureFlag[]>;
      return body.data ?? [];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const planType: PlanType = subscription?.planType ?? "starter";
  const orgFlags = featureFlags ?? [];
  const loading = !orgId;

  /**
   * Checks if a feature is available to the current user.
   * A feature is available if:
   *   1. The plan includes it (PLAN_FEATURES), AND
   *   2. The org hasn't explicitly disabled it (feature_flags table)
   * If no feature flag row exists, the feature defaults to ON (within plan limits).
   */
  const isFeatureEnabled = (feature: FeatureKey): boolean => {
    // First check: is the feature in the plan?
    if (!isPlanFeatureEnabled(planType, feature)) return false;

    // Second check: has the org explicitly disabled it?
    const flag = orgFlags.find((f) => f.flag_key === feature);
    if (flag) return flag.enabled;

    // No explicit flag = feature is enabled (opt-out system)
    return true;
  };

  /**
   * Returns all features available to this org's plan.
   */
  const planFeatures = getPlanFeatures(planType);

  return {
    isFeatureEnabled,
    planFeatures,
    planType,
    loading,
  };
}
