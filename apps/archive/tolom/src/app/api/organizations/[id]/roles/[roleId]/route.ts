import { createRouteHandler } from "@/lib/api-handler";
import { apiError, noContent, ok } from "@/lib/api-response";

export const PATCH = createRouteHandler(
  async ({ orgId, supabase, params, request }) => {
    const { roleId } = params;
    const body = await request.json();
    const { name, description, permissionIds } = body as {
      name?: string;
      description?: string | null;
      permissionIds?: string[];
    };

    // Verify the role exists and belongs to this org
    const { data: role, error: fetchError } = await supabase
      .from("roles")
      .select("id, name, description, is_system")
      .eq("id", roleId)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      return apiError("FETCH_ERROR", fetchError.message, 500);
    }

    if (!role) {
      return apiError("NOT_FOUND", "Role not found", 404);
    }

    if (role.is_system) {
      return apiError("FORBIDDEN", "System roles cannot be modified", 403);
    }

    // Build update payload
    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return apiError("VALIDATION_ERROR", "Role name cannot be empty", 400);
      }
      if (trimmedName.length > 60) {
        return apiError(
          "VALIDATION_ERROR",
          "Role name must be 60 characters or fewer",
          400,
        );
      }

      // Check for duplicate name (case-insensitive, excluding self)
      const { data: duplicate } = await supabase
        .from("roles")
        .select("id")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .ilike("name", trimmedName)
        .neq("id", roleId)
        .maybeSingle();

      if (duplicate) {
        return apiError(
          "DUPLICATE",
          "A role with this name already exists",
          409,
        );
      }

      updates.name = trimmedName;
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    // Apply role updates if any
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("roles")
        .update(updates)
        .eq("id", roleId);

      if (updateError) {
        return apiError("UPDATE_ERROR", updateError.message, 500);
      }
    }

    // Replace permissions if provided
    if (permissionIds !== undefined) {
      // Delete existing
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId);

      if (deleteError) {
        return apiError("PERMISSION_ERROR", deleteError.message, 500);
      }

      // Insert new
      if (permissionIds.length > 0) {
        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(
            permissionIds.map((pid) => ({
              role_id: roleId,
              permission_id: pid,
            })),
          );

        if (insertError) {
          return apiError("PERMISSION_ERROR", insertError.message, 500);
        }
      }
    }

    return ok({ success: true });
  },
  { minimumRole: "Org Owner", rateLimit: true },
);

export const DELETE = createRouteHandler(
  async ({ orgId, supabase, params }) => {
    const { roleId } = params;

    // Verify the role exists and belongs to this org
    const { data: role, error: fetchError } = await supabase
      .from("roles")
      .select("id, is_system")
      .eq("id", roleId)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      return apiError("FETCH_ERROR", fetchError.message, 500);
    }

    if (!role) {
      return apiError("NOT_FOUND", "Role not found", 404);
    }

    if (role.is_system) {
      return apiError("FORBIDDEN", "System roles cannot be deleted", 403);
    }

    // Check if any active members use this role
    const { count } = await supabase
      .from("organization_users")
      .select("user_id", { count: "exact", head: true })
      .eq("role_id", roleId)
      .eq("organization_id", orgId)
      .is("removed_at", null);

    if (count && count > 0) {
      return apiError(
        "ROLE_IN_USE",
        `Cannot delete role: ${count} member(s) are still assigned to it`,
        409,
      );
    }

    // Soft-delete
    const { error: deleteError } = await supabase
      .from("roles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", roleId);

    if (deleteError) {
      return apiError("DELETE_ERROR", deleteError.message, 500);
    }

    return noContent();
  },
  { minimumRole: "Org Owner", rateLimit: true },
);
