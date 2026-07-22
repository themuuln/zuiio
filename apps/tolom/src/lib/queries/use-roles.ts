"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import type { ManagedRole, PermissionRecord } from "@/lib/types";
import { createOrgQuery } from "./factory";
import { memberKeys } from "./use-members";

// ── Types ──────────────────────────────────────────────────────────

export interface CreateRoleVariables {
  name: string;
  description: string | null;
  permissionIds: string[];
}

export interface UpdateRoleVariables extends CreateRoleVariables {
  roleId: string;
}

// ── Keys ───────────────────────────────────────────────────────────

export const roleKeys = {
  all: (orgId: string) => ["organizations", orgId, "roles"] as const,
  list: (orgId: string) => [...roleKeys.all(orgId), "list"] as const,
  permissions: (orgId: string) =>
    ["organizations", orgId, "permissions"] as const,
};

// ── Fetchers ───────────────────────────────────────────────────────

const fetchRoles = createOrgQuery<ManagedRole[]>("/roles");
const fetchPermissions = createOrgQuery<PermissionRecord[]>("/permissions");

// ── Hooks ──────────────────────────────────────────────────────────

export function useRoles(
  orgId: string | undefined,
): UseQueryResult<ManagedRole[], Error> {
  return useQuery({
    queryKey: roleKeys.list(orgId ?? ""),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchRoles(orgId);
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function usePermissions(
  orgId: string | undefined,
): UseQueryResult<PermissionRecord[], Error> {
  return useQuery({
    queryKey: roleKeys.permissions(orgId ?? ""),
    queryFn: () => {
      if (!orgId) throw new Error("orgId required");
      return fetchPermissions(orgId);
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────

export function useCreateRole(orgId: string | undefined) {
  return useOrgMutation<ManagedRole, CreateRoleVariables>({
    endpoint: `/api/organizations/${orgId}/roles`,
    method: "POST",
    queryKey: roleKeys.list(orgId ?? ""),
    invalidateKeys: [memberKeys.roles(orgId ?? "")],
    successMessage: "Role created",
  });
}

export function useUpdateRole(orgId: string | undefined) {
  return useOrgMutation<unknown, UpdateRoleVariables>({
    endpoint: (vars) => `/api/organizations/${orgId}/roles/${vars.roleId}`,
    method: "PATCH",
    queryKey: roleKeys.list(orgId ?? ""),
    invalidateKeys: [memberKeys.roles(orgId ?? "")],
    bodyFn: (vars) => ({
      name: vars.name,
      description: vars.description,
      permissionIds: vars.permissionIds,
    }),
    successMessage: "Role updated",
  });
}

export function useDeleteRole(orgId: string | undefined) {
  return useOrgMutation<unknown, { roleId: string }>({
    endpoint: (vars) => `/api/organizations/${orgId}/roles/${vars.roleId}`,
    method: "DELETE",
    queryKey: roleKeys.list(orgId ?? ""),
    invalidateKeys: [memberKeys.roles(orgId ?? "")],
    successMessage: "Role deleted",
  });
}
