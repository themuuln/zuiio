"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { createOrgQuery } from "./factory";
import { useOrgMutation } from "@zuiio/query";

// ── Types ──────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role_id: string;
  role_name: string;
  branch_id: string | null;
  branch_name: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface InviteWithEmail {
  id: string;
  email: string;
  role_id: string | null;
  status: string;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface Role {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// ── Keys ───────────────────────────────────────────────────────────

export const memberKeys = {
  all: (orgId: string) => ["organizations", orgId, "members"] as const,
  users: (orgId: string) => [...memberKeys.all(orgId), "users"] as const,
  invites: (orgId: string) => [...memberKeys.all(orgId), "invites"] as const,
  roles: (orgId: string) => [...memberKeys.all(orgId), "roles"] as const,
};

// ── Fetchers ───────────────────────────────────────────────────────

const fetchUsers = createOrgQuery<UserProfile[]>("/users");
const fetchInvites = createOrgQuery<InviteWithEmail[]>("/invites");
const fetchRoles = createOrgQuery<Role[]>("/roles");

// ── Hooks ──────────────────────────────────────────────────────────

export function useMembers(
  orgId: string | undefined,
): UseQueryResult<UserProfile[], Error> {
  return useQuery({
    queryKey: memberKeys.users(orgId ?? ""),
    queryFn: () => fetchUsers(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useInvites(
  orgId: string | undefined,
): UseQueryResult<InviteWithEmail[], Error> {
  return useQuery({
    queryKey: memberKeys.invites(orgId ?? ""),
    queryFn: () => fetchInvites(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useRoles(
  orgId: string | undefined,
): UseQueryResult<Role[], Error> {
  return useQuery({
    queryKey: memberKeys.roles(orgId ?? ""),
    queryFn: () => fetchRoles(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────

interface InviteVariables {
  email: string;
  roleId?: string;
}

export function useCreateInvite(orgId: string | undefined) {
  return useOrgMutation<unknown, InviteVariables>({
    endpoint: `/api/organizations/${orgId}/invites`,
    method: "POST",
    queryKey: memberKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({
      email: vars.email.trim(),
      roleId: vars.roleId || undefined,
    }),
    successMessage: "Invitation sent",
  });
}

interface UpdateRoleVariables {
  userId: string;
  roleId: string;
}

export function useUpdateMemberRole(orgId: string | undefined) {
  return useOrgMutation<unknown, UpdateRoleVariables>({
    endpoint: (vars) => `/api/organizations/${orgId}/users/${vars.userId}`,
    method: "PATCH",
    queryKey: memberKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({ roleId: vars.roleId }),
    successMessage: "Role updated",
  });
}

interface UpdateMemberVariables {
  userId: string;
  fullName?: string;
  phone?: string;
  roleId: string;
  branchId?: string;
}

export function useUpdateMember(orgId: string | undefined) {
  return useOrgMutation<unknown, UpdateMemberVariables>({
    endpoint: (vars) => `/api/organizations/${orgId}/users/${vars.userId}`,
    method: "PATCH",
    queryKey: memberKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({
      fullName: vars.fullName || null,
      phone: vars.phone || null,
      roleId: vars.roleId,
      branchId: vars.branchId || null,
    }),
    successMessage: "Member updated",
  });
}

export function useCancelInvite(orgId: string | undefined) {
  return useOrgMutation<unknown, { inviteId: string }>({
    endpoint: `/api/organizations/${orgId}/invites`,
    method: "DELETE",
    queryKey: memberKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({ inviteId: vars.inviteId }),
    successMessage: "Invitation cancelled",
  });
}

export function useResendInvite(orgId: string | undefined) {
  return useOrgMutation<unknown, { inviteId: string }>({
    endpoint: `/api/organizations/${orgId}/invites`,
    method: "PATCH",
    queryKey: memberKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({ inviteId: vars.inviteId, action: "resend" }),
    successMessage: "Invitation resent",
  });
}

export function useRemoveMember(orgId: string | undefined) {
  return useOrgMutation<unknown, { userId: string }>({
    endpoint: `/api/organizations/${orgId}/users`,
    method: "DELETE",
    queryKey: memberKeys.all(orgId ?? ""),
    bodyFn: (vars) => ({ userId: vars.userId }),
    successMessage: "Member removed",
  });
}
