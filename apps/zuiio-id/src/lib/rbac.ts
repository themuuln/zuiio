import { createAdminClient } from "@/lib/supabase/server";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface OrgMembership {
  id: string;
  org_id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  joined_at: string;
}

/** Narrow a Supabase result row to an object we can index into. */
function toRow(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object")
    return value as Record<string, unknown>;
  return null;
}

/** Extract the `name` field from a nested `roles` join. */
function roleName(row: Record<string, unknown>): string | null {
  const roles = row["roles"];
  if (roles && typeof roles === "object" && "name" in roles) {
    const name = (roles as Record<string, unknown>)["name"];
    if (typeof name === "string") return name;
  }
  return null;
}

/** Extract a Permission from a role_permissions join row. */
function toPermission(row: Record<string, unknown>): Permission | null {
  const value = row["permissions"];
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj["id"] !== "string") return null;
  if (typeof obj["resource"] !== "string") return null;
  if (typeof obj["action"] !== "string") return null;
  return {
    id: obj["id"],
    resource: obj["resource"],
    action: obj["action"],
    description: typeof obj["description"] === "string" ? obj["description"] : null,
  };
}

/**
 * Get all roles.
 */
export async function getRoles(): Promise<Role[]> {
  const admin = await createAdminClient();
  const { data } = await admin.from("roles").select("*").order("name");
  return (data ?? []) as Role[];
}

/**
 * Get a user's memberships across all organizations.
 */
export async function getUserMemberships(
  userId: string,
): Promise<OrgMembership[]> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("org_memberships")
    .select("id, org_id, user_id, role_id, joined_at, roles!inner(name)")
    .eq("user_id", userId);

  return (data ?? [])
    .map(toRow)
    .filter((r): r is Record<string, unknown> => r !== null)
    .map((m) => ({
      id: String(m["id"]),
      org_id: String(m["org_id"]),
      user_id: String(m["user_id"]),
      role_id: String(m["role_id"]),
      role_name: roleName(m) ?? "",
      joined_at: String(m["joined_at"]),
    }));
}

/**
 * Get a user's role in a specific organization.
 */
export async function getUserOrgRole(
  userId: string,
  orgId: string,
): Promise<string | null> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("org_memberships")
    .select("roles!inner(name)")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();

  const row = toRow(data);
  if (!row) return null;
  return roleName(row);
}

/**
 * Check if a user has a specific permission in an organization.
 */
export async function userHasPermission(
  userId: string,
  orgId: string,
  resource: string,
  action: string,
): Promise<boolean> {
  const admin = await createAdminClient();

  // Get user's role in this org
  const { data: membership } = await admin
    .from("org_memberships")
    .select("role_id")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();

  const membershipRow = toRow(membership);
  if (!membershipRow) return false;

  const roleId = membershipRow["role_id"];
  if (typeof roleId !== "string") return false;

  // Get the permission id
  const { data: perm } = await admin
    .from("permissions")
    .select("id")
    .eq("resource", resource)
    .eq("action", action)
    .single();

  const permRow = toRow(perm);
  if (!permRow) return false;

  const permId = permRow["id"];
  if (typeof permId !== "string") return false;

  // Check if role has this permission
  const { data: rolePerm } = await admin
    .from("role_permissions")
    .select("role_id")
    .eq("role_id", roleId)
    .eq("permission_id", permId)
    .single();

  return rolePerm !== null;
}

/**
 * Get all permissions for a user in an organization.
 */
export async function getUserPermissions(
  userId: string,
  orgId: string,
): Promise<Permission[]> {
  const admin = await createAdminClient();

  // Get user's role in this org
  const { data: membership } = await admin
    .from("org_memberships")
    .select("role_id")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();

  const membershipRow = toRow(membership);
  if (!membershipRow) return [];

  const roleId = membershipRow["role_id"];
  if (typeof roleId !== "string") return [];

  // Get permissions for that role
  const { data } = await admin
    .from("role_permissions")
    .select("permissions!inner(*)")
    .eq("role_id", roleId);

  return (data ?? [])
    .map(toRow)
    .filter((r): r is Record<string, unknown> => r !== null)
    .map(toPermission)
    .filter((p): p is Permission => p !== null);
}
