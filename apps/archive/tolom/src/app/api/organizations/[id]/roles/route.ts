import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import type { ManagedRole, PermissionRecord } from "@/lib/types";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    // Fetch roles with member counts
    const { data: roles, error } = await supabase
      .from("roles")
      .select("id, name, description, is_system")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("is_system", { ascending: false })
      .order("name");

    if (error) {
      return apiError("FETCH_ERROR", error.message, 500);
    }

    // Fetch member counts per role
    const { data: memberCounts } = await supabase
      .from("organization_users")
      .select("role_id")
      .eq("organization_id", orgId)
      .is("removed_at", null);

    const countMap = new Map<string, number>();
    for (const m of memberCounts ?? []) {
      if (m.role_id) {
        countMap.set(m.role_id, (countMap.get(m.role_id) ?? 0) + 1);
      }
    }

    // Fetch permission assignments per role
    const { data: rolePerms } = await supabase
      .from("role_permissions")
      .select(
        "role_id, permissions!inner(id, name, resource, action, description)",
      )
      .in(
        "role_id",
        (roles ?? []).map((r) => r.id),
      );

    const permMap = new Map<string, PermissionRecord[]>();
    for (const rp of rolePerms ?? []) {
      const perm = Array.isArray(rp.permissions)
        ? rp.permissions[0]
        : (rp.permissions as unknown as PermissionRecord | null);
      if (!perm) continue;
      const existing = permMap.get(rp.role_id) ?? [];
      existing.push(perm);
      permMap.set(rp.role_id, existing);
    }

    const result: ManagedRole[] = (roles ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      is_system: r.is_system,
      member_count: countMap.get(r.id) ?? 0,
      permissions: permMap.get(r.id) ?? [],
    }));

    return ok(result);
  },
  { minimumRole: "Org Owner" },
);

export const POST = createRouteHandler(
  async ({ orgId, supabase, request }) => {
    const body = await request.json();
    const { name, description, permissionIds } = body as {
      name?: string;
      description?: string | null;
      permissionIds?: string[];
    };

    if (!name?.trim()) {
      return apiError("VALIDATION_ERROR", "Role name is required", 400);
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 60) {
      return apiError(
        "VALIDATION_ERROR",
        "Role name must be 60 characters or fewer",
        400,
      );
    }

    // Check for duplicate name (case-insensitive)
    const { data: existing } = await supabase
      .from("roles")
      .select("id")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .ilike("name", trimmedName)
      .maybeSingle();

    if (existing) {
      return apiError("DUPLICATE", "A role with this name already exists", 409);
    }

    // Create the role
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .insert({
        organization_id: orgId,
        name: trimmedName,
        description: description?.trim() || null,
        is_system: false,
      })
      .select("id, name, description, is_system")
      .single();

    if (roleError || !role) {
      return apiError(
        "CREATE_ERROR",
        roleError?.message ?? "Failed to create role",
        500,
      );
    }

    // Assign permissions if provided
    if (permissionIds?.length) {
      const { error: permError } = await supabase
        .from("role_permissions")
        .insert(
          permissionIds.map((pid) => ({
            role_id: role.id,
            permission_id: pid,
          })),
        );

      if (permError) {
        // Roll back: delete the role we just created
        await supabase.from("roles").delete().eq("id", role.id);
        return apiError(
          "PERMISSION_ERROR",
          permError.message ?? "Failed to assign permissions",
          500,
        );
      }
    }

    return ok({
      id: role.id,
      name: role.name,
      description: role.description ?? null,
      is_system: role.is_system,
      member_count: 0,
      permissions: [],
    });
  },
  { minimumRole: "Org Owner", rateLimit: true },
);
