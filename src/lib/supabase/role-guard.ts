import { ForbiddenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const ROLE_HIERARCHY: Record<string, number> = {
  Guest: 0,
  Mechanic: 1,
  Manager: 2,
  "Org Owner": 3,
};

/**
 * Returns information about the authenticated user's role.
 */
export async function getUserRole(): Promise<{
  roleName: string | null;
  roleLevel: number;
  userId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { roleName: null, roleLevel: -1, userId: "" };
  }

  const { data: membership } = await supabase
    .from("organization_users")
    .select("role_id, roles(name)")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .is("removed_at", null)
    .maybeSingle();

  const rawRoles = membership?.roles;
  const roleName =
    rawRoles === null || rawRoles === undefined
      ? null
      : Array.isArray(rawRoles)
        ? (rawRoles[0]?.name ?? null)
        : ((rawRoles as unknown as { name: string }).name ?? null);

  return {
    roleName,
    roleLevel: ROLE_HIERARCHY[roleName ?? ""] ?? -1,
    userId: user.id,
  };
}

/**
 * Checks if the authenticated user has at least the given minimum role level.
 * Throws ForbiddenError if not authenticated or insufficient permissions.
 *
 * Role hierarchy: Guest < Mechanic < Manager < Org Owner
 *
 * Usage in API routes:
 * ```ts
 * export const GET = createRouteHandler(async (ctx) => {
 *   // ... handler logic
 * }, { minimumRole: "Manager" });
 * ```
 */
export async function requireRole(
  minimumRole: "Org Owner" | "Manager" | "Mechanic" | "Guest",
): Promise<void> {
  const { roleLevel, userId } = await getUserRole();

  if (!userId) {
    throw new ForbiddenError("Not authenticated");
  }

  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  if (roleLevel < requiredLevel) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

/**
 * Checks if the authenticated user's role has a specific permission.
 * Queries the role_permissions junction table through the permissions table.
 *
 * @param resource - The resource to check, e.g. "work_orders", "invoices", "inventory"
 * @param action   - The action to check, e.g. "create", "read", "update", "delete"
 * @param orgId    - Organization context. If omitted, uses the user's primary org.
 *
 * Throws ForbiddenError if the user lacks the permission.
 */
export async function requirePermission(
  resource: string,
  action: string,
  orgId?: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ForbiddenError("Not authenticated");
  }

  // Get the user's role for this organization
  let query = supabase
    .from("organization_users")
    .select("role_id, organization_id")
    .eq("user_id", user.id);

  if (orgId) {
    query = query.eq("organization_id", orgId);
  } else {
    query = query.eq("is_primary", true);
  }

  query = query.is("removed_at", null);

  const { data: membership } = await query.maybeSingle();

  if (!membership?.role_id) {
    throw new ForbiddenError("No role assigned");
  }

  const effectiveOrgId = orgId ?? membership.organization_id;

  // Find the permission record in this organization
  const { data: perm } = await supabase
    .from("permissions")
    .select("id")
    .eq("organization_id", effectiveOrgId)
    .eq("resource", resource)
    .eq("action", action)
    .is("deleted_at", null)
    .maybeSingle();

  if (!perm) {
    throw new ForbiddenError(
      `Permission "${resource}.${action}" not found for this organization`,
    );
  }

  // Check the role_permissions junction table
  const { data: rp } = await supabase
    .from("role_permissions")
    .select("role_id")
    .eq("role_id", membership.role_id)
    .eq("permission_id", perm.id)
    .maybeSingle();

  if (!rp) {
    throw new ForbiddenError(
      `Missing required permission: ${resource}.${action}`,
    );
  }
}

/**
 * Returns whether the authenticated user has a specific permission.
 * Non-throwing version of requirePermission.
 */
export async function hasPermission(
  resource: string,
  action: string,
  orgId?: string,
): Promise<boolean> {
  try {
    await requirePermission(resource, action, orgId);
    return true;
  } catch {
    return false;
  }
}
