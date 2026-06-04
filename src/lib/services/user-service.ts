import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logSupabaseResult } from "@/lib/supabase/logger";
import type { UserProfile } from "@/lib/types";

/**
 * Lists all users belonging to an organization, including their roles.
 * Joins organization_users → roles and profiles.
 */
export async function getOrganizationUsers(
  orgId: string,
): Promise<UserProfile[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("organization_users")
    .select(`
      user_id,
      role_id,
      branch_id,
      roles (
        id,
        name
      )
    `)
    .eq("organization_id", orgId)
    .is("removed_at", null);

  if (error) {
    throw new Error(error.message ?? "Failed to fetch organization users");
  }

  if (!members?.length) return [];

  // Fetch profiles separately — no direct FK from organization_users to profiles
  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, phone, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        full_name: p.full_name,
        username: p.username,
        phone: p.phone,
        avatar_url: p.avatar_url,
      },
    ]),
  );

  return members.map((m) => {
    const role = Array.isArray(m.roles)
      ? m.roles[0]
      : (m.roles as unknown as { id: string; name: string } | null);
    const profile = profileMap.get(m.user_id);

    return {
      id: m.user_id,
      email: "",
      username: profile?.username ?? null,
      phone: profile?.phone ?? null,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      organizationId: orgId,
      organizationName: null,
      organizationLogoUrl: null,
      branchId: m.branch_id ?? null,
      roleId: m.role_id ?? null,
      roleName: role?.name ?? null,
    };
  });
}

/**
 * Invites a user to the organization by creating an organization_users entry.
 * The invited user must already have a profile row in the public.profiles table.
 */
export async function inviteUser(
  _orgId: string,
  email: string,
  _roleId?: string,
): Promise<void> {
  if (!email?.trim()) throw new ValidationError("Email is required");

  const supabase = await createClient();

  // Find the user by email in auth.users — we use the supabase admin
  // approach through a profile lookup via public.profiles table.
  // The email is stored in auth.users, not public.profiles, so we use a
  // different approach: try to find the profile by matching email via
  // auth.users lookup. Since the server client can't directly query
  // auth.users, we use the admin API approach if available, or fall
  // back to requiring the caller to pass a userId instead.
  //
  // For Phase 0 we rely on the caller passing an email that maps to
  // an existing auth user whose profile we can reference.
  //
  // Alternative: use supabase.auth.admin.listUsers() — requires
  // service_role key. For now we do a raw auth.users lookup via rpc.
  const { data: _profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", email) // placeholder — real impl needs user lookup
    .maybeSingle();

  // NOTE: In production, you would look up the user by email using
  // the Supabase Admin API (service_role key). For Phase 0 foundation
  // we accept user IDs directly or use an RPC function.
  //
  // The invite flow will be:
  // 1. Check if user exists → if not, send invite email to sign up
  // 2. Once user has an auth account + profile, add to org_users
  //
  // Placeholder until user lookup RPC is implemented:
  throw new Error(
    "inviteUser requires user lookup RPC — pass userId directly for now",
  );
}

/**
 * Adds a known user (by userId) to an organization with a role.
 * Use this when you already have the user's auth ID.
 */
export async function addUserToOrganization(
  orgId: string,
  userId: string,
  roleId?: string,
): Promise<void> {
  const supabase = await createClient();

  // Resolve role before any checks (needed for both insert and reactivate)
  let resolvedRoleId = roleId;
  if (!resolvedRoleId) {
    const { data: defaultRole } = await supabase
      .from("roles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("name", "Mechanic")
      .maybeSingle();

    if (defaultRole) {
      resolvedRoleId = defaultRole.id;
    } else {
      const { data: anyRole } = await supabase
        .from("roles")
        .select("id")
        .eq("organization_id", orgId)
        .limit(1)
        .maybeSingle();

      if (!anyRole) {
        throw new NotFoundError("No roles found in this organization");
      }
      resolvedRoleId = anyRole.id;
    }
  }

  // Check if already an active member or previously removed
  const { data: existingUser } = await supabase
    .from("organization_users")
    .select("user_id, removed_at")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingUser) {
    if (existingUser.removed_at) {
      // Re-activate a previously removed member
      const { error: reactivateError } = await supabase
        .from("organization_users")
        .update({ removed_at: null, role_id: resolvedRoleId })
        .eq("user_id", userId)
        .eq("organization_id", orgId);

      if (reactivateError) {
        throw new ValidationError("Failed to reactivate user");
      }

      revalidateTag(cacheTags.organizationUsers(orgId), "max");
      return;
    }

    throw new ValidationError("User is already a member of this organization");
  }

  const { error } = await supabase.from("organization_users").insert({
    organization_id: orgId,
    user_id: userId,
    role_id: resolvedRoleId,
    is_primary: false,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to add user to organization");
  }

  revalidateTag(cacheTags.organizationUsers(orgId), "max");
}

/**
 * Changes a user's role within the organization.
 */
export async function updateUserRole(
  userId: string,
  orgId: string,
  roleId: string,
): Promise<void> {
  const supabase = await createClient();

  // Verify the role belongs to this organization
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("id", roleId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!role) {
    throw new NotFoundError("Role not found in this organization");
  }

  const { error } = await supabase
    .from("organization_users")
    .update({ role_id: roleId })
    .eq("user_id", userId)
    .eq("organization_id", orgId);

  if (error) {
    throw new NotFoundError("User membership not found");
  }

  revalidateTag(cacheTags.organizationUsers(orgId), "max");
}

/**
 * Updates a member's profile and organization membership fields.
 *
 * Accepts any subset of: fullName, phone (→ profiles table);
 * roleId, branchId (→ organization_users table).
 */
export async function updateMember(
  userId: string,
  orgId: string,
  params: {
    fullName?: string | null;
    phone?: string | null;
    roleId?: string;
    branchId?: string | null;
  },
): Promise<void> {
  const supabase = await createClient();
  // Service role client needed for profiles updates — RLS only allows
  // users to update their own profile (id = auth.uid()), but an org owner
  // editing another member's profile is not the profile owner.
  const serviceRole = await createServiceRoleClient();

  // ── Update profiles table (user's own data) ──────────────
  const profileUpdates: Record<string, unknown> = {};
  if (params.fullName !== undefined) profileUpdates.full_name = params.fullName;
  if (params.phone !== undefined) profileUpdates.phone = params.phone;

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await serviceRole
      .from("profiles")
      .update(profileUpdates)
      .eq("id", userId);

    logSupabaseResult(profileError, "profiles.update", {
      userId,
      ...profileUpdates,
    });

    if (profileError) {
      throw new Error(
        profileError.message ?? "Failed to update member profile",
      );
    }
  }

  // ── Update organization_users table (membership data) ────
  const membershipUpdates: Record<string, unknown> = {};
  if (params.roleId !== undefined) membershipUpdates.role_id = params.roleId;
  if (params.branchId !== undefined)
    membershipUpdates.branch_id = params.branchId;

  if (Object.keys(membershipUpdates).length > 0) {
    // If roleId is changing, verify the role belongs to this org
    if (params.roleId !== undefined) {
      const { data: role } = await supabase
        .from("roles")
        .select("id")
        .eq("id", params.roleId)
        .eq("organization_id", orgId)
        .maybeSingle();

      if (!role) {
        throw new NotFoundError("Role not found in this organization");
      }
    }

    // If branchId is changing to a non-null value, verify the branch belongs to this org
    if (params.branchId !== undefined && params.branchId !== null) {
      const { data: branch } = await supabase
        .from("branches")
        .select("id")
        .eq("id", params.branchId)
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!branch) {
        throw new NotFoundError("Branch not found in this organization");
      }
    }

    const { error: membershipError } = await supabase
      .from("organization_users")
      .update(membershipUpdates)
      .eq("user_id", userId)
      .eq("organization_id", orgId);

    if (membershipError) {
      throw new NotFoundError(
        membershipError.message ?? "User membership not found",
      );
    }
  }

  revalidateTag(cacheTags.organizationUsers(orgId), "max");
}

/**
 * Removes a user from the organization.
 */
export async function removeUser(userId: string, orgId: string): Promise<void> {
  const supabase = await createClient();

  // Prevent removing the last admin
  const { data: allAdmins } = await supabase
    .from("organization_users")
    .select("user_id, roles!inner(name)")
    .eq("organization_id", orgId)
    .eq("roles.name", "Org Owner")
    .is("removed_at", null);

  const adminCount = allAdmins?.length ?? 0;
  const isTargetAdmin = allAdmins?.some((a) => a.user_id === userId);

  if (isTargetAdmin && adminCount <= 1) {
    throw new ForbiddenError(
      "Cannot remove the last owner of the organization",
    );
  }

  const { error } = await supabase
    .from("organization_users")
    .update({ removed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("organization_id", orgId);

  if (error) {
    throw new NotFoundError("User membership not found");
  }

  revalidateTag(cacheTags.organizationUsers(orgId), "max");
}

/**
 * Gets the current authenticated user's profile, including their
 * organization membership and role information.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const user = authData.user;
  const meta = user.user_metadata as unknown as Record<string, unknown>;

  // Get profile and membership in parallel
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, organization_id, branch_id, full_name, username, phone, avatar_url, is_active, created_at, updated_at",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("organization_users")
      .select(`
        organization_id,
        role_id,
        branch_id,
        roles (
          id,
          name
        )
      `)
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  let orgName: string | null = null;
  if (membership) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", membership.organization_id)
      .is("deleted_at", null)
      .maybeSingle();
    orgName = org?.name ?? null;
  }

  const membershipRole = Array.isArray(membership?.roles)
    ? membership?.roles[0]
    : (membership?.roles as unknown as { id: string; name: string } | null);

  return {
    id: user.id,
    email: "",
    username: profile?.username ?? null,
    phone: profile?.phone ?? (user.phone as string) ?? null,
    fullName:
      profile?.full_name ??
      (meta?.full_name as string) ??
      (meta?.name as string) ??
      null,
    avatarUrl: profile?.avatar_url ?? (meta?.avatar_url as string) ?? null,
    organizationId: membership?.organization_id ?? null,
    organizationName: orgName,
    branchId: membership?.branch_id ?? null,
    roleId: membership?.role_id ?? null,
    roleName: membershipRole?.name ?? null,
  };
}
