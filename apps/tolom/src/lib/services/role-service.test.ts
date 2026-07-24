import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: string[], fn: () => unknown) => fn()),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const ORG_ID = "org-001";
const ROLE_ID = "role-001";
const CUSTOM_ROLE_ID = "role-custom-1";

// ── Helpers ──────────────────────────────────────────────────────────────

function createQueryBuilder<TData = unknown>(response?: {
  data?: TData;
  error?: null;
  count?: number;
}) {
  const resolved = {
    data: (response?.data ?? []) as TData,
    error: response?.error ?? null,
    ...(response?.count !== undefined ? { count: response.count } : {}),
  };

  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: response?.data ?? null,
      error: response?.error ?? null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: response?.data ?? null,
      error: response?.error ?? null,
    }),
    then: vi.fn((resolve: (value: typeof resolved) => void) =>
      resolve(resolved),
    ),
  };
}

function _b<TData = unknown>(data?: TData, count?: number) {
  return createQueryBuilder<TData>({ data, count });
}

// ── Role queries (extracted from API routes for direct testing) ───────────

/**
 * Simulates GET /api/organizations/[id]/roles logic:
 * Fetches roles with member counts and permission assignments.
 */
async function getRoles(db: ReturnType<typeof createMockSupabaseClient>) {
  const { data: roles, error } = await db
    .from("roles")
    .select("id, name, description, is_system")
    .eq("organization_id", ORG_ID)
    .is("deleted_at", null)
    .order("is_system", { ascending: false })
    .order("name");

  if (error) {
    throw new Error(`FETCH_ERROR: ${error.message}`);
  }

  // Member counts
  const { data: memberCounts } = await db
    .from("organization_users")
    .select("role_id")
    .eq("organization_id", ORG_ID)
    .is("removed_at", null);

  const countMap = new Map<string, number>();
  for (const m of (memberCounts ?? []) as { role_id: string }[]) {
    countMap.set(m.role_id, (countMap.get(m.role_id) ?? 0) + 1);
  }

  // Permission assignments
  const { data: rolePerms } = await db
    .from("role_permissions")
    .select(
      "role_id, permissions!inner(id, name, resource, action, description)",
    )
    .in(
      "role_id",
      (roles ?? []).map((r: { id: string }) => r.id),
    );

  const permMap = new Map<string, unknown[]>();
  for (const rp of (rolePerms ?? []) as {
    role_id: string;
    permissions: unknown;
  }[]) {
    const existing = permMap.get(rp.role_id) ?? [];
    existing.push(rp.permissions);
    permMap.set(rp.role_id, existing);
  }

  return (roles ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    memberCount: countMap.get(r.id as string) ?? 0,
    permissions: permMap.get(r.id as string) ?? [],
  }));
}

/**
 * Simulates POST /api/organizations/[id]/roles logic.
 */
async function createRole(
  db: ReturnType<typeof createMockSupabaseClient>,
  name: string,
  description: string | null,
  permissionIds: string[],
) {
  const { data, error } = await db
    .from("roles")
    .insert({ name, description, organization_id: ORG_ID })
    .select("id, name, description, is_system")
    .single();

  if (error) {
    throw new Error(`INSERT_ERROR: ${error.message}`);
  }

  if (permissionIds.length > 0 && data) {
    const { error: rpError } = await db.from("role_permissions").insert(
      permissionIds.map((pid) => ({
        role_id: data.id,
        permission_id: pid,
      })),
    );
    if (rpError) {
      throw new Error(`PERM_INSERT_ERROR: ${rpError.message}`);
    }
  }

  return data;
}

/**
 * Simulates PATCH /api/organizations/[id]/roles/[roleId] logic.
 */
async function updateRole(
  db: ReturnType<typeof createMockSupabaseClient>,
  roleId: string,
  updates: {
    name?: string;
    description?: string | null;
    permissionIds?: string[];
  },
) {
  // Verify role exists
  const { data: role } = await db
    .from("roles")
    .select("id, name, description, is_system")
    .eq("id", roleId)
    .eq("organization_id", ORG_ID)
    .is("deleted_at", null)
    .maybeSingle();

  if (!role) {
    throw new ForbiddenError("Role not found");
  }
  if ((role as { is_system: boolean }).is_system) {
    throw new ForbiddenError("System roles cannot be modified");
  }

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined)
    payload.description = updates.description?.trim() || null;

  if (Object.keys(payload).length > 0) {
    const { error } = await db.from("roles").update(payload).eq("id", roleId);
    if (error) throw new Error(`UPDATE_ERROR: ${error.message}`);
  }

  if (updates.permissionIds !== undefined) {
    await db.from("role_permissions").delete().eq("role_id", roleId);
    if (updates.permissionIds.length > 0) {
      await db.from("role_permissions").insert(
        updates.permissionIds.map((pid) => ({
          role_id: roleId,
          permission_id: pid,
        })),
      );
    }
  }

  return { success: true };
}

/**
 * Simulates DELETE /api/organizations/[id]/roles/[roleId] logic.
 */
async function deleteRole(
  db: ReturnType<typeof createMockSupabaseClient>,
  roleId: string,
) {
  const { data: role } = await db
    .from("roles")
    .select("id, is_system")
    .eq("id", roleId)
    .eq("organization_id", ORG_ID)
    .is("deleted_at", null)
    .maybeSingle();

  if (!role) {
    throw new ForbiddenError("Role not found");
  }
  if ((role as { is_system: boolean }).is_system) {
    throw new ForbiddenError("System roles cannot be modified");
  }

  await db
    .from("roles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", roleId);
  await db.from("role_permissions").delete().eq("role_id", roleId);

  return { success: true };
}

// ── getRoles ─────────────────────────────────────────────────────────────

describe("getRoles", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("returns roles with member counts and permissions", async () => {
    const roles = [
      {
        id: "r1",
        name: "Org Owner",
        description: "Full access",
        is_system: true,
      },
      {
        id: "r2",
        name: "Mechanic",
        description: "Shop floor",
        is_system: true,
      },
    ];
    const memberCounts = [
      { role_id: "r1" },
      { role_id: "r1" },
      { role_id: "r2" },
    ];
    const rolePerms = [
      {
        role_id: "r1",
        permissions: {
          id: "p1",
          name: "reports.read",
          resource: "reports",
          action: "read",
          description: "View reports",
        },
      },
    ];

    mockClient.__qb.resolveWith({ data: roles, error: null });

    // Chain: from().select().eq().is().order().order()
    const rolesBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: roles, error: null }),
      ),
    };
    const memberBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: memberCounts, error: null }),
      ),
    };
    const permBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: rolePerms, error: null }),
      ),
    };

    mockClient.from
      .mockReturnValueOnce(rolesBuilder as never)
      .mockReturnValueOnce(memberBuilder as never)
      .mockReturnValueOnce(permBuilder as never);

    const result = await getRoles(mockClient);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: "Org Owner",
      memberCount: 2,
    });
    expect(result[1]).toMatchObject({
      name: "Mechanic",
      memberCount: 1,
    });
  });

  it("returns empty array when org has no roles", async () => {
    const emptyBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null }),
      ),
    };
    const emptyMemberBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null }),
      ),
    };
    const emptyPermBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null }),
      ),
    };

    mockClient.from
      .mockReturnValueOnce(emptyBuilder as never)
      .mockReturnValueOnce(emptyMemberBuilder as never)
      .mockReturnValueOnce(emptyPermBuilder as never);

    const result = await getRoles(mockClient);
    expect(result).toEqual([]);
  });
});

// ── createRole ───────────────────────────────────────────────────────────

describe("createRole", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("creates a role with permissions", async () => {
    const newRole = {
      id: CUSTOM_ROLE_ID,
      name: "Junior Mechanic",
      description: "Limited access",
      is_system: false,
    };

    mockClient.__qb.resolveWith({ data: newRole, error: null });

    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newRole, error: null }),
    };
    const permBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockClient.from
      .mockReturnValueOnce(builder as never)
      .mockReturnValueOnce(permBuilder as never);

    const result = await createRole(
      mockClient,
      "Junior Mechanic",
      "Limited access",
      ["perm-1", "perm-2"],
    );

    expect(result).toEqual(newRole);
    expect(builder.insert).toHaveBeenCalledWith({
      name: "Junior Mechanic",
      description: "Limited access",
      organization_id: ORG_ID,
    });
    expect(permBuilder.insert).toHaveBeenCalledWith([
      { role_id: CUSTOM_ROLE_ID, permission_id: "perm-1" },
      { role_id: CUSTOM_ROLE_ID, permission_id: "perm-2" },
    ]);
  });
});

// ── updateRole ───────────────────────────────────────────────────────────

describe("updateRole", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("updates custom role name and description", async () => {
    const existing = {
      id: CUSTOM_ROLE_ID,
      name: "Junior",
      description: null,
      is_system: false,
    };

    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
    };
    const updateBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockClient.from
      .mockReturnValueOnce(fetchBuilder as never)
      .mockReturnValueOnce(updateBuilder as never);

    const result = await updateRole(mockClient, CUSTOM_ROLE_ID, {
      name: "Senior Mechanic",
      description: "Advanced access",
    });

    expect(result).toEqual({ success: true });
    expect(updateBuilder.update).toHaveBeenCalledWith({
      name: "Senior Mechanic",
      description: "Advanced access",
    });
  });

  it("rejects update to system role", async () => {
    const systemRole = {
      id: ROLE_ID,
      name: "Org Owner",
      description: null,
      is_system: true,
    };

    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: systemRole, error: null }),
    };

    mockClient.from.mockReturnValueOnce(fetchBuilder as never);

    await expect(
      updateRole(mockClient, ROLE_ID, { name: "Hacked" }),
    ).rejects.toThrow("System roles cannot be modified");
  });

  it("replaces permissions when permissionIds provided", async () => {
    const existing = {
      id: CUSTOM_ROLE_ID,
      name: "Junior",
      description: null,
      is_system: false,
    };

    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
    };
    const deleteBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const insertBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockClient.from
      .mockReturnValueOnce(fetchBuilder as never)
      .mockReturnValueOnce(deleteBuilder as never)
      .mockReturnValueOnce(insertBuilder as never);

    const result = await updateRole(mockClient, CUSTOM_ROLE_ID, {
      permissionIds: ["perm-3", "perm-4"],
    });

    expect(result).toEqual({ success: true });
    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(insertBuilder.insert).toHaveBeenCalledWith([
      { role_id: CUSTOM_ROLE_ID, permission_id: "perm-3" },
      { role_id: CUSTOM_ROLE_ID, permission_id: "perm-4" },
    ]);
  });
});

// ── deleteRole ───────────────────────────────────────────────────────────

describe("deleteRole", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  it("soft-deletes custom role and removes permissions", async () => {
    const customRole = { id: CUSTOM_ROLE_ID, is_system: false };

    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: customRole, error: null }),
    };
    const updateBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const deleteBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockClient.from
      .mockReturnValueOnce(fetchBuilder as never)
      .mockReturnValueOnce(updateBuilder as never)
      .mockReturnValueOnce(deleteBuilder as never);

    const result = await deleteRole(mockClient, CUSTOM_ROLE_ID);

    expect(result).toEqual({ success: true });
    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
    expect(updateBuilder.eq).toHaveBeenCalledWith("id", CUSTOM_ROLE_ID);
    expect(deleteBuilder.delete).toHaveBeenCalled();
  });

  it("rejects deletion of system role", async () => {
    const systemRole = { id: ROLE_ID, is_system: true };

    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: systemRole, error: null }),
    };

    mockClient.from.mockReturnValueOnce(fetchBuilder as never);

    await expect(deleteRole(mockClient, ROLE_ID)).rejects.toThrow(
      "System roles cannot be modified",
    );
  });
});
