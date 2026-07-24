import type { SupabaseClient } from "@supabase/supabase-js";

export interface ZuiioUser {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface ZuiioOrg {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface ZuiioRole {
  id: string;
  name: string;
  description: string | null;
}

export interface ZuiioClient {
  /** Get the current authenticated user */
  getUser(): Promise<ZuiioUser | null>;
  /** Get user's organizations */
  getOrgs(): Promise<ZuiioOrg[]>;
  /** Get roles available in an organization */
  getRoles(orgId: string): Promise<ZuiioRole[]>;
  /** Check if user has a permission in an org */
  hasPermission(orgId: string, resource: string, action: string): Promise<boolean>;
  /** Get user's permissions in an org */
  getPermissions(orgId: string): Promise<Array<{ resource: string; action: string }>>;
  /** Sign out */
  signOut(): Promise<void>;
}

/**
 * Helper: narrow an unknown value to an object and return it as a Record.
 */
function toRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return null;
}

/**
 * Helper: extract a string field from a row.
 */
function getString(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  return typeof v === "string" ? v : "";
}

/**
 * Create a Zuiio client instance.
 * Wraps a Supabase client with SSO-specific helpers.
 */
export function createZuiioClient(supabase: SupabaseClient): ZuiioClient {
  async function getUser(): Promise<ZuiioUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .single();

    const profileRow = toRecord(profile);

    return {
      id: user.id,
      email: user.email ?? "",
      fullName: profileRow ? getString(profileRow, "full_name") : user.user_metadata?.full_name ?? "",
      username: profileRow ? (getString(profileRow, "username") || null) : null,
      avatarUrl: profileRow ? (getString(profileRow, "avatar_url") || null) : null,
    };
  }

  async function getOrgs(): Promise<ZuiioOrg[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("org_memberships")
      .select("organizations!inner(id, name, slug), roles!inner(name)")
      .eq("user_id", user.id);

    return (data ?? []).map((m) => {
      const org = toRecord(m.organizations);
      const role = toRecord(m.roles);
      return {
        id: org ? getString(org, "id") : "",
        name: org ? getString(org, "name") : "",
        slug: org ? getString(org, "slug") : "",
        role: role ? getString(role, "name") : "",
      };
    });
  }

  async function getRoles(orgId: string): Promise<ZuiioRole[]> {
    const { data } = await supabase
      .from("role_permissions")
      .select("roles!inner(id, name, description)")
      .eq("org_id", orgId);

    const roleIds = new Set<string>();
    const result: ZuiioRole[] = [];

    for (const rp of data ?? []) {
      const role = toRecord(rp.roles);
      if (!role) continue;
      const id = getString(role, "id");
      if (!id || roleIds.has(id)) continue;
      roleIds.add(id);
      result.push({
        id,
        name: getString(role, "name"),
        description: getString(role, "description") || null,
      });
    }

    return result;
  }

  async function hasPermission(orgId: string, resource: string, action: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: membership } = await supabase
      .from("org_memberships")
      .select("role_id")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (!membership) return false;

    const { data: perm } = await supabase
      .from("role_permissions")
      .select("id")
      .eq("role_id", membership.role_id)
      .maybeSingle();

    return !!perm;
  }

  async function getPermissions(orgId: string): Promise<Array<{ resource: string; action: string }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: membership } = await supabase
      .from("org_memberships")
      .select("role_id")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (!membership) return [];

    const { data } = await supabase
      .from("role_permissions")
      .select("permissions!inner(resource, action)")
      .eq("role_id", membership.role_id);

    return (data ?? []).map((rp) => {
      const perm = toRecord(rp.permissions);
      return {
        resource: perm ? getString(perm, "resource") : "",
        action: perm ? getString(perm, "action") : "",
      };
    });
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  return { getUser, getOrgs, getRoles, hasPermission, getPermissions, signOut };
}
