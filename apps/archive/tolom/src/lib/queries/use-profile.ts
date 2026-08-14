"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { PermissionAction } from "@/lib/supabase/role-guard";
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
  permissionNames: string[];
}

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
        permissionNames: d.permissionNames ?? d.data?.permissionNames ?? [],
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
 * Derived hook: current user's role and permission-based access.
 */
export function useCurrentUserRole() {
  const query = useProfile();
  const profile = query.data;

  const permissionSet = useMemo(
    () => new Set(profile?.permissionNames ?? []),
    [profile?.permissionNames],
  );

  const isOrgOwner = profile?.roleName === "Org Owner";
  const isMechanic = profile?.roleName === "Mechanic";

  /**
   * Check whether the current user has a specific permission.
   * Uses the exact `resource.action` name from the permission catalog.
   */
  const hasPermission = (
    resource: string,
    action: PermissionAction,
  ): boolean => {
    return permissionSet.has(`${resource}.${action}`);
  };

  return {
    ...query,
    profile,
    role: profile?.roleName ?? null,
    loading: query.isLoading,
    isOrgOwner,
    isAdmin: isOrgOwner,
    isManager: false, // deprecated — use hasPermission instead
    isMechanic,
    isGuest: profile?.roleName === "Guest",
    permissionNames: profile?.permissionNames ?? [],
    hasPermission,
  };
}
