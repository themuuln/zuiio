"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";

// ── Types ──────────────────────────────────────────────────────────

export interface AdminMe {
  isSuperAdmin: boolean;
  role: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // biome-ignore lint/suspicious/noExplicitAny: Admin API returns dynamic fields
  [key: string]: any;
}

export interface AdminOrg {
  id: string;
  name: string;
  plan_type: string;
  status: string;
  owner_name: string | null;
  owner_email: string;
  created_at: string;
  trial_ends_at: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // biome-ignore lint/suspicious/noExplicitAny: Admin API returns dynamic fields
  [key: string]: any;
}

// ── Keys ───────────────────────────────────────────────────────────

export const adminKeys = {
  all: ["admin"] as const,
  me: () => [...adminKeys.all, "me"] as const,
  organizations: () => [...adminKeys.all, "organizations"] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────

export function useAdminMe(): UseQueryResult<AdminMe, Error> {
  return useQuery({
    queryKey: adminKeys.me(),
    queryFn: async () => {
      const res = await fetch("/api/admin/me");
      const json = await res.json();
      return json.data as AdminMe;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useAdminOrganizations(): UseQueryResult<AdminOrg[], Error> {
  return useQuery({
    queryKey: adminKeys.organizations(),
    queryFn: async () => {
      const res = await fetch("/api/admin/organizations");
      const json = await res.json();
      return (json.data ?? []) as AdminOrg[];
    },
    staleTime: 60_000,
    retry: 1,
  });
}

// ── Mutations ──────────────────────────────────────────────────────

export function useUpdateOrgPlan() {
  return useOrgMutation<unknown, { orgId: string; planType: string }>({
    endpoint: (vars) => `/api/admin/organizations/${vars.orgId}/subscription`,
    method: "PATCH",
    queryKey: adminKeys.organizations(),
    bodyFn: (vars) => ({
      planType: vars.planType,
      status: "active",
    }),
    successMessage: "Plan updated",
  });
}

export function useExtendTrial() {
  return useOrgMutation<unknown, { orgId: string }>({
    endpoint: (vars) => `/api/admin/organizations/${vars.orgId}/subscription`,
    method: "PATCH",
    queryKey: adminKeys.organizations(),
    bodyFn: () => ({ action: "extend" }),
    successMessage: "Trial extended",
  });
}
