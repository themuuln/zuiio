import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/query", () => ({
  withDbCapture: vi.fn((_label: string, promise: Promise<unknown>) => promise),
}));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(),
  logAuditAfter: vi.fn(),
}));

import {
  getUserRole,
  hasPermission,
  requirePermission,
  requireRole,
} from "./role-guard";

const mockCreateClient = vi.mocked(createClient);
let mockClient: ReturnType<typeof createMockSupabaseClient>;

const USER_ID = "user-123";
const ORG_ID = "org-456";
const ROLE_ID = "role-789";
const PERM_ID = "perm-001";

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  mockCreateClient.mockResolvedValue(mockClient as never);

  // Default: authenticated user
  mockClient.auth.getUser.mockResolvedValue({
    data: { user: { id: USER_ID } as never },
    error: null,
  });
});

// ── getUserRole ──────────────────────────────────────────────────────────

describe("getUserRole", () => {
  /**
   * getUserRole makes ONE from() call:
   *   from("organization_users").select("role_id, roles(name)")
   *     .eq("user_id", user.id).eq("is_primary", true)
   *     .is("removed_at", null).maybeSingle()
   *
   * Returns { roleName, roleLevel, userId }
   */
  function mockSingleFrom(roleName: string | null) {
    mockClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: roleName ? { role_id: ROLE_ID, roles: { name: roleName } } : null,
        error: null,
      }),
    } as never);
  }

  it("returns Org Owner role info with hierarchyLevel 3", async () => {
    mockSingleFrom("Org Owner");

    const result = await getUserRole();
    expect(result.roleName).toBe("Org Owner");
    expect(result.roleLevel).toBe(3);
    expect(result.userId).toBe(USER_ID);
  });

  it("returns Mechanic role info with hierarchyLevel 1", async () => {
    mockSingleFrom("Mechanic");

    const result = await getUserRole();
    expect(result.roleName).toBe("Mechanic");
    expect(result.roleLevel).toBe(1);
  });

  it("returns null role when user is not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await getUserRole();
    expect(result.roleName).toBeNull();
    expect(result.roleLevel).toBe(-1);
    expect(result.userId).toBe("");
  });

  it("returns null role when no membership found", async () => {
    mockSingleFrom(null);

    const result = await getUserRole();
    expect(result.roleName).toBeNull();
    expect(result.roleLevel).toBe(-1);
  });
});

// ── requireRole ──────────────────────────────────────────────────────────

describe("requireRole", () => {
  function mockSingleFrom(roleName: string | null) {
    mockClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: roleName ? { role_id: ROLE_ID, roles: { name: roleName } } : null,
        error: null,
      }),
    } as never);
  }

  it("passes when user has Org Owner (3) and minimum is Manager (2)", async () => {
    mockSingleFrom("Org Owner");
    await expect(requireRole("Manager")).resolves.toBeUndefined();
  });

  it("passes when user has exact minimum role", async () => {
    mockSingleFrom("Manager");
    await expect(requireRole("Manager")).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when role is below minimum", async () => {
    mockSingleFrom("Mechanic"); // level 1, need Manager (2)
    await expect(requireRole("Manager")).rejects.toThrow();
  });

  it("throws ForbiddenError when user is unauthenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    await expect(requireRole("Guest")).rejects.toThrow("Not authenticated");
  });
});

// ── requirePermission ────────────────────────────────────────────────────

describe("requirePermission", () => {
  /**
   * requirePermission makes THREE from() calls:
   * 1. from("organization_users").select().eq().eq().is().maybeSingle()
   * 2. from("permissions").select().eq().eq().eq().is().maybeSingle()
   * 3. from("role_permissions").select().eq().eq().maybeSingle()
   */
  function setupPermissionChain(opts?: {
    permFound?: boolean;
    rpFound?: boolean;
  }) {
    const permFound = opts?.permFound ?? true;
    const rpFound = opts?.rpFound ?? true;

    // 1. organization_users
    mockClient.from
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role_id: ROLE_ID, organization_id: ORG_ID },
          error: null,
        }),
      } as never)
      // 2. permissions
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: permFound ? { id: PERM_ID } : null,
          error: null,
        }),
      } as never)
      // 3. role_permissions
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: rpFound ? { role_id: ROLE_ID } : null,
          error: null,
        }),
      } as never);
  }

  it("passes when role has the required permission", async () => {
    setupPermissionChain({ permFound: true, rpFound: true });
    await expect(
      requirePermission("reports", "read", ORG_ID),
    ).resolves.toBeUndefined();
  });

  it("throws when permission not found in permissions table", async () => {
    setupPermissionChain({ permFound: false });
    await expect(requirePermission("reports", "read", ORG_ID)).rejects.toThrow(
      "not found",
    );
  });

  it("throws when role_permissions junction is missing", async () => {
    setupPermissionChain({ permFound: true, rpFound: false });
    await expect(requirePermission("reports", "read", ORG_ID)).rejects.toThrow(
      "Missing required permission",
    );
  });

  it("throws when user is not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    await expect(requirePermission("reports", "read")).rejects.toThrow(
      "Not authenticated",
    );
  });
});

// ── hasPermission ────────────────────────────────────────────────────────

describe("hasPermission", () => {
  function setupPermissionChain(opts?: {
    permFound?: boolean;
    rpFound?: boolean;
  }) {
    const permFound = opts?.permFound ?? true;
    const rpFound = opts?.rpFound ?? true;

    mockClient.from
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role_id: ROLE_ID, organization_id: ORG_ID },
          error: null,
        }),
      } as never)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: permFound ? { id: PERM_ID } : null,
          error: null,
        }),
      } as never)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: rpFound ? { role_id: ROLE_ID } : null,
          error: null,
        }),
      } as never);
  }

  it("returns true when role has the permission", async () => {
    setupPermissionChain({ permFound: true, rpFound: true });
    const result = await hasPermission("reports", "read", ORG_ID);
    expect(result).toBe(true);
  });

  it("returns false when permission not found", async () => {
    setupPermissionChain({ permFound: false });
    const result = await hasPermission("reports", "read", ORG_ID);
    expect(result).toBe(false);
  });

  it("returns false when role_permissions junction missing", async () => {
    setupPermissionChain({ permFound: true, rpFound: false });
    const result = await hasPermission("reports", "read", ORG_ID);
    expect(result).toBe(false);
  });

  it("returns false when user is not authenticated", async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const result = await hasPermission("reports", "read");
    expect(result).toBe(false);
  });
});
