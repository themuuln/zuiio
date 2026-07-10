"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { profileKeys } from "./keys";

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationName: string | null;
  branchId: string | null;
  roleId: string | null;
  roleName: string | null;
}

type RoleName = "Org Owner" | "Manager" | "Mechanic" | "Guest" | null;

/**
 * Single source of truth for the current user's profile.
 * All other hooks that need profile data should derive from this
 * instead of making their own `/api/profile` fetch.
 */
export function useProfile(): UseQueryResult<UserProfile | null, Error> {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      const d = await res.json();
      return {
        id: d.id ?? "",
        email: d.email ?? "",
        username: d.username ?? null,
        phone: d.phone ?? null,
        fullName: d.fullName ?? null,
        avatarUrl: d.avatarUrl ?? null,
        organizationId: d.organizationId ?? d.data?.organizationId ?? null,
        organizationName:
          d.organizationName ?? d.data?.organizationName ?? null,
        branchId: d.branchId ?? d.data?.branchId ?? null,
        roleId: d.roleId ?? null,
        roleName: d.roleName ?? null,
      };
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/**
 * Derived hook: current organization info from the profile.
 */
export function useCurrentOrg() {
  const query = useProfile();
  const profile = query.data;

  const orgId = profile?.organizationId ?? null;
  const orgName = profile?.organizationName ?? null;
  const branchId = profile?.branchId ?? null;

  return {
    ...query,
    data: orgId ? { orgId, orgName, branchId } : null,
  };
}

/**
 * Derived hook: current user's role and role-based flags.
 */
export function useCurrentUserRole() {
  const query = useProfile();
  const profile = query.data;

  const roleName: RoleName =
    profile?.roleName === "Org Owner" ||
    profile?.roleName === "Manager" ||
    profile?.roleName === "Mechanic" ||
    profile?.roleName === "Guest"
      ? profile.roleName
      : null;

  return {
    ...query,
    profile,
    role: roleName,
    loading: query.isLoading,
    isOrgOwner: roleName === "Org Owner",
    isAdmin: roleName === "Org Owner",
    isManager: roleName === "Manager",
    isMechanic: roleName === "Mechanic",
    isGuest: roleName === "Guest",
  };
}
