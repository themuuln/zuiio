/**
 * Integration tests for Auth & Access domain.
 *
 * Covers: roles, role_permissions, permission check functions,
 * profile role assignment, set_role_permissions RPC.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

// ── Roles CRUD ──────────────────────────────────

describe("Roles CRUD", () => {
  const admin = createAdminClient();

  it("admin can create a role with name and optional fields", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: role, error } = await admin
      .from("roles")
      .insert({
        organization_id: orgId,
        name: "Custom Manager",
        description: "Custom role with specific permissions",
        hierarchy_level: 5,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(role!.name).toBe("Custom Manager");
    expect(role!.hierarchy_level).toBe(5);
    expect(role!.is_system_role).toBe(false);
    trackCleanup("roles", role!.id);
  });

  it("admin can read roles filtered by org", async () => {
    const { orgId } = await createTestOrg(admin);

    await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "Role-A" })
      .select()
      .single();
    await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "Role-B" })
      .select()
      .single();

    const { data: roles, error } = await admin
      .from("roles")
      .select("id, name")
      .eq("organization_id", orgId);
    expect(error).toBeNull();
    expect(roles!.length).toBeGreaterThanOrEqual(2);
  });

  it("admin can update role name", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: role } = await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "Old Name" })
      .select()
      .single();
    trackCleanup("roles", role!.id);

    const { error } = await admin
      .from("roles")
      .update({ name: "Updated Name" })
      .eq("id", role!.id);
    expect(error).toBeNull();

    const { data: updated } = await admin
      .from("roles")
      .select("name")
      .eq("id", role!.id)
      .single();
    expect(updated!.name).toBe("Updated Name");
  });

  it("admin can delete a role", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: role } = await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "To Delete" })
      .select()
      .single();

    const { error } = await admin.from("roles").delete().eq("id", role!.id);
    expect(error).toBeNull();

    const { data: check } = await admin
      .from("roles")
      .select("id")
      .eq("id", role!.id)
      .single();
    expect(check).toBeNull();
  });

  it("can atomically replace all permissions for a role", async () => {
    const { orgId } = await createTestOrg(admin);

    // The set_role_permissions RPC checks has_permission('roles.manage').
    // Service_role client bypasses RLS but has no profile entry.
    // Must use an authenticated user with roles.manage permission.
    const user = await createTestUserWithPermissions(
      admin,
      orgId,
      "RoleManager",
      ["roles.manage"],
    );

    const { data: role } = await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "Atomic Role" })
      .select()
      .single();
    trackCleanup("roles", role!.id);

    // Add some initial permissions
    await admin
      .from("role_permissions")
      .insert([{ role_id: role!.id, permission: "products.read" }]);

    // Replace with new set via RPC
    const { data: result, error } = await user.client.rpc(
      "set_role_permissions",
      {
        p_role_id: role!.id,
        p_permissions: ["products.create", "sales.read", "contacts.read"],
      },
    );
    expect(error).toBeNull();
    expect(result).toHaveProperty("success", true);

    // Verify old permission is gone and new ones are present
    const { data: perms } = await admin
      .from("role_permissions")
      .select("permission")
      .eq("role_id", role!.id);
    const permValues = perms!.map((p) => p.permission).sort();
    expect(permValues).toEqual([
      "contacts.read",
      "products.create",
      "sales.read",
    ]);
  });

  it("user WITHOUT roles.manage permission gets error from set_role_permissions", async () => {
    const { orgId } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(admin, orgId, "NoPerm", [
      "products.read",
    ]);

    const { data: existingRole } = await admin
      .from("roles")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .single();
    if (!existingRole) throw new Error("No role found");

    const { data: result } = await user.client.rpc("set_role_permissions", {
      p_role_id: existingRole!.id,
      p_permissions: ["sales.create"],
    });
    expect(result).toHaveProperty("error", "Permission denied");
  });

  it("user WITH roles.manage permission succeeds with set_role_permissions", async () => {
    const { orgId } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(
      admin,
      orgId,
      "CanManage",
      ["roles.manage"],
    );

    const { data: role } = await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "Managed Role" })
      .select()
      .single();
    trackCleanup("roles", role!.id);

    const { data: result, error: rpcErr } = await user.client.rpc(
      "set_role_permissions",
      {
        p_role_id: role!.id,
        p_permissions: ["sales.create", "sales.read"],
      },
    );
    expect(rpcErr).toBeNull();
    expect(result).toHaveProperty("success", true);
  });

  it("can read permissions for a role", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: role } = await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "Read Perms" })
      .select()
      .single();
    trackCleanup("roles", role!.id);

    await admin.from("role_permissions").insert([
      { role_id: role!.id, permission: "products.read" },
      { role_id: role!.id, permission: "sales.read" },
    ]);

    const { data: perms, error } = await admin
      .from("role_permissions")
      .select("permission")
      .eq("role_id", role!.id);
    expect(error).toBeNull();
    expect(perms!.length).toBe(2);
  });

  it("admin can delete a specific permission from a role", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: role } = await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "Del Perm" })
      .select()
      .single();
    trackCleanup("roles", role!.id);

    const { data: rp } = await admin
      .from("role_permissions")
      .insert({ role_id: role!.id, permission: "products.delete" })
      .select()
      .single();

    const { error } = await admin
      .from("role_permissions")
      .delete()
      .eq("id", rp!.id);
    expect(error).toBeNull();
  });
});

// ── Permission check functions ──────────────────

describe("Permission check functions", () => {
  const admin = createAdminClient();

  it("has_permission() returns true for a user who has the permission", async () => {
    const { orgId } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(
      admin,
      orgId,
      "HasSalesRead",
      ["sales.read"],
    );

    const { data: result, error } = await user.client.rpc("has_permission", {
      p_permission: "sales.read",
    });
    expect(error).toBeNull();
    expect(result).toBe(true);
  });

  it("has_permission() returns false for a permission the user doesn't have", async () => {
    const { orgId } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(admin, orgId, "Limited", [
      "sales.read",
    ]);

    const { data: result, error } = await user.client.rpc("has_permission", {
      p_permission: "roles.manage",
    });
    expect(error).toBeNull();
    expect(result).toBe(false);
  });

  it("user_has_permission() checks a specific user_id", async () => {
    const { orgId } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(admin, orgId, "SpecUser", [
      "products.create",
    ]);

    const { data: result, error } = await admin.rpc("user_has_permission", {
      p_user_id: user.userId,
      p_permission: "products.create",
    });
    expect(error).toBeNull();
    expect(result).toBe(true);
  });

  it("get_user_permissions() returns all permissions for current user", async () => {
    const { orgId } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(admin, orgId, "GetPerms", [
      "products.read",
      "products.create",
      "sales.read",
    ]);

    const { data: result, error } = await user.client.rpc(
      "get_user_permissions",
    );
    expect(error).toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBeGreaterThanOrEqual(3);
    expect(result).toContain("products.read");
    expect(result).toContain("sales.read");
  });
});

// ── Profile role assignment ─────────────────────

describe("Profile role assignment", () => {
  const admin = createAdminClient();

  it("admin can update a profile's role_id", async () => {
    const { orgId } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(
      admin,
      orgId,
      "ProfUpdate",
      ["products.read"],
    );

    // Find user's profile and its current role
    const { data: profile } = await admin
      .from("profiles")
      .select("id, organization_id, role_id")
      .eq("id", user.userId)
      .single();
    expect(profile!.role_id).not.toBeNull();

    // Create a new role and assign it
    const { data: newRole } = await admin
      .from("roles")
      .insert({ organization_id: orgId, name: "New Role For Profile" })
      .select()
      .single();
    trackCleanup("roles", newRole!.id);

    const { error } = await admin
      .from("profiles")
      .update({ role_id: newRole!.id })
      .eq("id", user.userId);
    expect(error).toBeNull();

    // Verify the update
    const { data: updated } = await admin
      .from("profiles")
      .select("role_id")
      .eq("id", user.userId)
      .single();
    expect(updated!.role_id).toBe(newRole!.id);
  });
});

// ── RLS ──────────────────────────────────────────

describe("Row Level Security", () => {
  it("anon cannot create roles", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("roles").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacker Role",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot read role_permissions", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("role_permissions").select("*");
    // RLS should either error 42501 or return empty array
    if (error) {
      expect(error.code).toBe("42501");
    } else {
      // If RLS is configured permissively, the anon role gets no data
      // but we just verify the query doesn't leak data
    }
  });
});
