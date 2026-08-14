import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  AppError: class extends Error {
    constructor(
      m: string,
      public code?: string,
      public status?: number,
    ) {
      super(m);
      this.name = "AppError";
    }
  },
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
  ForbiddenError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ForbiddenError";
    }
  },
  UnauthorizedError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "UnauthorizedError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
}));
vi.mock("@/lib/supabase/logger", () => ({ logSupabaseResult: vi.fn() }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { logSupabaseResult } from "@/lib/supabase/logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { resolveBranchId } from "@/lib/supabase/with-branch";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const _mockResolveBranchId = vi.mocked(resolveBranchId);
const _mockLogSupabaseResult = vi.mocked(logSupabaseResult);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

import {
  addUserToOrganization,
  getCurrentUserProfile,
  getOrganizationUsers,
  inviteUser,
  removeUser,
  updateMember,
  updateUserRole,
} from "../user-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const ROLE_ID = "role-1";
const BRANCH_ID = "branch-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── getOrganizationUsers ──────────────────────────────────────────

describe("getOrganizationUsers", () => {
  const members = [
    {
      user_id: "u1",
      role_id: ROLE_ID,
      branch_id: BRANCH_ID,
      roles: { id: ROLE_ID, name: "Mechanic" },
    },
    {
      user_id: "u2",
      role_id: null,
      branch_id: null,
      roles: null,
    },
  ];

  it("returns organization users with profile info", async () => {
    const profiles = [
      {
        id: "u1",
        full_name: "Alice",
        username: "alice",
        phone: "+976-1111",
        avatar_url: "https://example.com/avatar.png",
      },
      {
        id: "u2",
        full_name: null,
        username: null,
        phone: null,
        avatar_url: null,
      },
    ];

    db.__qb.resolveOnce({ data: members, error: null });
    db.__qb.resolveOnce({ data: profiles, error: null });

    const result = await getOrganizationUsers(db as never, ORG_ID);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("u1");
    expect(result[0].fullName).toBe("Alice");
    expect(result[0].roleName).toBe("Mechanic");
    expect(result[0].branchId).toBe(BRANCH_ID);
    expect(result[1].id).toBe("u2");
    expect(result[1].fullName).toBeNull();
    expect(result[1].roleName).toBeNull();
  });

  it("returns empty array when no members exist", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getOrganizationUsers(db as never, ORG_ID);

    expect(result).toEqual([]);
  });

  it("throws on query error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Failed to fetch organization users"),
    });

    await expect(getOrganizationUsers(db as never, ORG_ID)).rejects.toThrow(
      "Failed to fetch organization users",
    );
  });

  it("handles empty profiles gracefully", async () => {
    db.__qb.resolveOnce({ data: members, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getOrganizationUsers(db as never, ORG_ID);

    expect(result).toHaveLength(2);
    expect(result[0].fullName).toBeNull();
  });
});

// ── inviteUser ────────────────────────────────────────────────────

describe("inviteUser", () => {
  it("throws ValidationError when email is empty", async () => {
    await expect(inviteUser(db as never, ORG_ID, "  ")).rejects.toThrow(
      ValidationError,
    );
  });

  it("throws not-implemented error (placeholder)", async () => {
    await expect(
      inviteUser(db as never, ORG_ID, "test@example.com"),
    ).rejects.toThrow("inviteUser requires user lookup RPC");
  });
});

// ── addUserToOrganization ─────────────────────────────────────────

describe("addUserToOrganization", () => {
  it("adds a new user to the organization with default role", async () => {
    const defaultRole = { id: ROLE_ID };
    const ms = db.from("roles").maybeSingle;
    ms.mockResolvedValueOnce({ data: defaultRole, error: null });
    ms.mockResolvedValueOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await addUserToOrganization(db as never, ORG_ID, USER_ID);

    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("adds a new user with specified role", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await addUserToOrganization(db as never, ORG_ID, USER_ID, ROLE_ID);

    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError when no roles exist in organization", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      addUserToOrganization(db as never, ORG_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("reactivates a previously removed member", async () => {
    const existingUser = {
      user_id: USER_ID,
      removed_at: "2025-01-01T00:00:00Z",
    };
    const defaultRole = { id: ROLE_ID };
    const ms = db.from("roles").maybeSingle;
    ms.mockResolvedValueOnce({ data: defaultRole, error: null });
    ms.mockResolvedValueOnce({ data: existingUser, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await addUserToOrganization(db as never, ORG_ID, USER_ID);

    expect(mockRevalidateTag).toHaveBeenCalled();
  });
  it("throws ValidationError when user is already an active member", async () => {
    const existingUser = { user_id: USER_ID, removed_at: null };
    const ms = db.from("roles").maybeSingle;
    ms.mockResolvedValueOnce({ data: { id: ROLE_ID }, error: null });
    ms.mockResolvedValueOnce({ data: existingUser, error: null });

    await expect(
      addUserToOrganization(db as never, ORG_ID, USER_ID),
    ).rejects.toThrow(ValidationError);
  });
  it("throws ValidationError when reactivation fails", async () => {
    const existingUser = {
      user_id: USER_ID,
      removed_at: "2025-01-01T00:00:00Z",
    };
    const ms = db.from("roles").maybeSingle;
    ms.mockResolvedValueOnce({ data: { id: ROLE_ID }, error: null });
    ms.mockResolvedValueOnce({ data: existingUser, error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("Update failed") });

    await expect(
      addUserToOrganization(db as never, ORG_ID, USER_ID),
    ).rejects.toThrow(ValidationError);
  });
});

// ── updateUserRole ────────────────────────────────────────────────

describe("updateUserRole", () => {
  it("updates the user's role and revalidates cache", async () => {
    db.from("roles").maybeSingle.mockResolvedValueOnce({
      data: { id: ROLE_ID, name: "Mechanic", is_system: false },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });

    await updateUserRole(db as never, USER_ID, ORG_ID, ROLE_ID);

    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError when role does not exist", async () => {
    await expect(
      updateUserRole(db as never, USER_ID, ORG_ID, "nonexistent-role"),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ForbiddenError when role is Org Owner", async () => {
    db.from("roles").maybeSingle.mockResolvedValueOnce({
      data: { id: ROLE_ID, name: "Org Owner", is_system: true },
      error: null,
    });

    await expect(
      updateUserRole(db as never, USER_ID, ORG_ID, ROLE_ID),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError when update fails", async () => {
    db.__qb.resolveOnce({
      data: { id: ROLE_ID, name: "Mechanic", is_system: false },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: new Error("Update failed") });

    await expect(
      updateUserRole(db as never, USER_ID, ORG_ID, ROLE_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── updateMember ──────────────────────────────────────────────────

describe("updateMember", () => {
  let svcDb: MockSupabaseClient;

  beforeEach(() => {
    svcDb = createMockSupabaseClient();
    mockCreateServiceRoleClient.mockResolvedValue(svcDb as never);
  });

  afterEach(() => {
    mockCreateServiceRoleClient.mockReset();
  });
  it("updates member profile and membership fields", async () => {
    svcDb.__qb.resolveOnce({ data: null, error: null });
    db.from("roles").maybeSingle.mockResolvedValueOnce({
      data: { id: ROLE_ID },
      error: null,
    });
    db.from("branches").maybeSingle.mockResolvedValueOnce({
      data: { id: BRANCH_ID },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });

    await updateMember(db as never, USER_ID, ORG_ID, {
      fullName: "Updated Name",
      phone: "+976-9999",
      roleId: ROLE_ID,
      branchId: BRANCH_ID,
    });

    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("updates only profile when only profile fields are provided", async () => {
    svcDb.__qb.resolveOnce({ data: null, error: null });

    await updateMember(db as never, USER_ID, ORG_ID, {
      fullName: "Only Name",
    });

    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError when role is not found in organization", async () => {
    svcDb.__qb.resolveOnce({ data: null, error: null });
    svcDb.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateMember(db as never, USER_ID, ORG_ID, { roleId: "bad-role" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when branch is not found", async () => {
    svcDb.__qb.resolveOnce({ data: null, error: null });
    svcDb.__qb.resolveOnce({ data: { id: ROLE_ID }, error: null });
    svcDb.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateMember(db as never, USER_ID, ORG_ID, {
        roleId: ROLE_ID,
        branchId: "bad-branch",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── removeUser ────────────────────────────────────────────────────

describe("removeUser", () => {
  it("soft-removes a user from the organization", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await removeUser(db as never, USER_ID, ORG_ID);

    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws ForbiddenError when removing the last Org Owner", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ user_id: USER_ID, roles: { name: "Org Owner" } }],
      error: null,
    });

    await expect(removeUser(db as never, USER_ID, ORG_ID)).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("throws NotFoundError when membership not found", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("Not found") });

    await expect(removeUser(db as never, USER_ID, ORG_ID)).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ── getCurrentUserProfile ─────────────────────────────────────────

describe("getCurrentUserProfile", () => {
  it("returns full user profile with membership and permissions", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: USER_ID,
          email: "user@example.com",
          user_metadata: { full_name: "Test User" },
          phone: "+976-1234",
        },
      },
      error: null,
    });
    const ms = db.from("profiles").maybeSingle;
    ms.mockResolvedValueOnce({
      data: {
        id: USER_ID,
        organization_id: ORG_ID,
        branch_id: BRANCH_ID,
        full_name: "Test User",
        username: "testuser",
        phone: "+976-1234",
        avatar_url: null,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });
    ms.mockResolvedValueOnce({
      data: {
        organization_id: ORG_ID,
        role_id: ROLE_ID,
        branch_id: BRANCH_ID,
        roles: { id: ROLE_ID, name: "Mechanic" },
      },
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ permissions: { name: "work_orders:read" } }],
      error: null,
    });
    ms.mockResolvedValueOnce({
      data: { name: "Test Org" },
      error: null,
    });

    const result = await getCurrentUserProfile(db as never);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(USER_ID);
    expect(result?.email).toBe("user@example.com");
    expect(result?.fullName).toBe("Test User");
    expect(result?.organizationId).toBe(ORG_ID);
    expect(result?.roleName).toBe("Mechanic");
    expect(result?.permissionNames).toContain("work_orders:read");
  });

  it("returns null when not authenticated", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    const result = await getCurrentUserProfile(db as never);

    expect(result).toBeNull();
  });

  it("handles missing profile and membership gracefully", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: USER_ID,
          email: "user@example.com",
          user_metadata: {},
        },
      },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getCurrentUserProfile(db as never);

    expect(result).not.toBeNull();
    expect(result?.fullName).toBe("user");
    expect(result?.organizationId).toBeNull();
  });
});
