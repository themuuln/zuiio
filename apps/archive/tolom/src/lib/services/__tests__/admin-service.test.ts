import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("../subscription-enforcement", () => ({
  invalidateSubscriptionCache: vi.fn(),
}));

import { invalidateSubscriptionCache } from "../subscription-enforcement";

const mockInvalidateCache = vi.mocked(invalidateSubscriptionCache);

import {
  assignSellerToOrg,
  checkAdminRole,
  checkSuperAdmin,
  createCampaign,
  deleteCampaign,
  extendSubscriptionTrial,
  getAdminUser,
  getPlatformStats,
  listCampaigns,
  listOrganizations,
  listSellerAssignments,
  removeSellerAssignment,
  updateCampaign,
  updateOrgSubscription,
} from "../admin-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── getAdminUser ──────────────────────────────────────────────────

describe("getAdminUser", () => {
  it("returns admin user when found", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: "admin-1",
        user_id: USER_ID,
        role: "super_admin",
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await getAdminUser(db as never);

    expect(result).not.toBeNull();
    expect(result?.user_id).toBe(USER_ID);
    expect(result?.role).toBe("super_admin");
  });

  it("returns null when no admin user exists", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await getAdminUser(db as never);

    expect(result).toBeNull();
  });

  it("returns null on database error", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: new Error("DB error"),
    });

    const result = await getAdminUser(db as never);

    expect(result).toBeNull();
  });
});

// ── checkSuperAdmin ───────────────────────────────────────────────

describe("checkSuperAdmin", () => {
  it("returns true for super_admin role", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: "admin-1",
        user_id: USER_ID,
        role: "super_admin",
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await checkSuperAdmin(db as never);

    expect(result).toBe(true);
  });

  it("returns false for non-super_admin role", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: "admin-1",
        user_id: USER_ID,
        role: "seller",
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await checkSuperAdmin(db as never);

    expect(result).toBe(false);
  });

  it("returns false when no admin user exists", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await checkSuperAdmin(db as never);

    expect(result).toBe(false);
  });
});

// ── checkAdminRole ────────────────────────────────────────────────

describe("checkAdminRole", () => {
  it("returns true when role matches exactly", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: "admin-1",
        user_id: USER_ID,
        role: "seller",
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await checkAdminRole(db as never, "seller");

    expect(result).toBe(true);
  });

  it("returns true when user is super_admin (overrides any check)", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: "admin-1",
        user_id: USER_ID,
        role: "super_admin",
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await checkAdminRole(db as never, "marketing_manager");

    expect(result).toBe(true);
  });

  it("returns false when role does not match", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: {
        id: "admin-1",
        user_id: USER_ID,
        role: "seller",
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await checkAdminRole(db as never, "marketing_manager");

    expect(result).toBe(false);
  });

  it("returns false when no admin user", async () => {
    vi.mocked(db.from("super_admins")).maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await checkAdminRole(db as never, "super_admin");

    expect(result).toBe(false);
  });
});

// ── listOrganizations ─────────────────────────────────────────────

describe("listOrganizations", () => {
  it("returns list of organizations", async () => {
    const orgs = [
      {
        id: ORG_ID,
        name: "Test Org",
        slug: "test-org",
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "org-2",
        name: "Second Org",
        slug: "second-org",
        is_active: false,
        created_at: "2025-02-01T00:00:00Z",
      },
    ];
    db.rpc = vi.fn().mockResolvedValue({ data: orgs, error: null });

    const result = await listOrganizations(db as never);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(ORG_ID);
    expect(result[0].name).toBe("Test Org");
    expect(result[1].is_active).toBe(false);
  });

  it("returns empty array when no organizations", async () => {
    db.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await listOrganizations(db as never);

    expect(result).toEqual([]);
  });

  it("throws on RPC error", async () => {
    db.rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("RPC failed") });

    await expect(listOrganizations(db as never)).rejects.toThrow("RPC failed");
  });
});

// ── updateOrgSubscription ─────────────────────────────────────────

describe("updateOrgSubscription", () => {
  it("updates subscription and invalidates cache", async () => {
    const updated = {
      id: "sub-1",
      plan_type: "premium",
      status: "active",
      started_at: "2025-01-01T00:00:00Z",
      expires_at: null,
      trial: false,
    };
    db.rpc = vi.fn().mockResolvedValue({ data: updated, error: null });

    const result = await updateOrgSubscription(db as never, ORG_ID, {
      planType: "premium",
    });

    expect(result.plan_type).toBe("premium");
    expect(db.rpc).toHaveBeenCalledWith("admin_update_subscription", {
      target_org_id: ORG_ID,
      new_plan_type: "premium",
      new_status: "active",
    });
    expect(mockInvalidateCache).toHaveBeenCalledWith(ORG_ID);
  });

  it("uses default status 'active' when not provided", async () => {
    const updated = {
      plan_type: "basic",
      status: "active",
      started_at: "2025-01-01T00:00:00Z",
      expires_at: null,
      trial: false,
    };
    db.rpc = vi.fn().mockResolvedValue({ data: updated, error: null });

    await updateOrgSubscription(db as never, ORG_ID, { planType: "basic" });

    expect(db.rpc).toHaveBeenCalledWith("admin_update_subscription", {
      target_org_id: ORG_ID,
      new_plan_type: "basic",
      new_status: "active",
    });
  });

  it("throws on RPC error", async () => {
    db.rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("Update failed") });

    await expect(
      updateOrgSubscription(db as never, ORG_ID, { planType: "premium" }),
    ).rejects.toThrow("Update failed");
  });
});

// ── extendSubscriptionTrial ───────────────────────────────────────

describe("extendSubscriptionTrial", () => {
  it("extends trial and invalidates cache", async () => {
    const updated = {
      id: "sub-1",
      plan_type: "free",
      status: "trial",
      started_at: "2025-01-01T00:00:00Z",
      expires_at: "2025-03-01T00:00:00Z",
      trial: true,
    };
    db.rpc = vi.fn().mockResolvedValue({ data: updated, error: null });

    const result = await extendSubscriptionTrial(db as never, ORG_ID);

    expect(result.status).toBe("trial");
    expect(db.rpc).toHaveBeenCalledWith("admin_extend_subscription", {
      target_org_id: ORG_ID,
    });
    expect(mockInvalidateCache).toHaveBeenCalledWith(ORG_ID);
  });

  it("throws on RPC error", async () => {
    db.rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("Extend failed") });

    await expect(extendSubscriptionTrial(db as never, ORG_ID)).rejects.toThrow(
      "Extend failed",
    );
  });
});

// ── listSellerAssignments ─────────────────────────────────────────

describe("listSellerAssignments", () => {
  it("returns seller assignments with org info", async () => {
    const rows = [
      {
        id: "sa-1",
        seller_id: USER_ID,
        organization_id: ORG_ID,
        created_at: "2025-01-01T00:00:00Z",
        organizations: { name: "Test Org", slug: "test-org" },
      },
    ];

    db.__qb.resolveOnce({ data: rows, error: null });

    const result = await listSellerAssignments(db as never, USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("sa-1");
    expect(result[0].organization_name).toBe("Test Org");
    expect(result[0].organization_slug).toBe("test-org");
  });

  it("returns empty array when no assignments", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await listSellerAssignments(db as never, USER_ID);

    expect(result).toEqual([]);
  });

  it("throws on query error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Query failed") });

    await expect(listSellerAssignments(db as never, USER_ID)).rejects.toThrow(
      "Query failed",
    );
  });
});

// ── assignSellerToOrg ─────────────────────────────────────────────

describe("assignSellerToOrg", () => {
  it("creates a seller assignment", async () => {
    const assignment = {
      id: "sa-1",
      seller_id: USER_ID,
      organization_id: ORG_ID,
      created_at: "2025-01-01T00:00:00Z",
    };
    db.__qb.resolveOnce({ data: assignment, error: null });

    const result = await assignSellerToOrg(db as never, USER_ID, ORG_ID);

    expect(result.id).toBe("sa-1");
    expect(result.seller_id).toBe(USER_ID);
    expect(result.organization_id).toBe(ORG_ID);
  });

  it("throws on insert error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Insert failed") });

    await expect(
      assignSellerToOrg(db as never, USER_ID, ORG_ID),
    ).rejects.toThrow("Insert failed");
  });
});

// ── removeSellerAssignment ────────────────────────────────────────

describe("removeSellerAssignment", () => {
  it("deletes a seller assignment", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await removeSellerAssignment(db as never, "sa-1");

    expect(db.from).toHaveBeenCalled();
  });

  it("throws on delete error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Delete failed") });

    await expect(removeSellerAssignment(db as never, "sa-1")).rejects.toThrow(
      "Delete failed",
    );
  });
});

// ── listCampaigns ─────────────────────────────────────────────────

describe("listCampaigns", () => {
  it("returns marketing campaigns with org names", async () => {
    const campaigns = [
      {
        id: "camp-1",
        organization_id: ORG_ID,
        name: "Spring Sale",
        type: "email",
        status: "active",
        target_count: 100,
        sent_count: 50,
        opened_count: 25,
        clicked_count: 10,
        created_by: USER_ID,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        organizations: { name: "Test Org" },
      },
    ];

    db.__qb.resolveOnce({ data: campaigns, error: null });

    const result = await listCampaigns(db as never);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Spring Sale");
    expect(result[0].organization_name).toBe("Test Org");
  });

  it("returns empty array when no campaigns", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await listCampaigns(db as never);

    expect(result).toEqual([]);
  });

  it("throws on query error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Query failed") });

    await expect(listCampaigns(db as never)).rejects.toThrow("Query failed");
  });
});

// ── createCampaign ────────────────────────────────────────────────

describe("createCampaign", () => {
  it("creates and returns a campaign with org name", async () => {
    const data = {
      id: "camp-1",
      organization_id: ORG_ID,
      name: "Summer Blast",
      type: "email",
      status: "draft",
      target_count: 0,
      sent_count: 0,
      opened_count: 0,
      clicked_count: 0,
      created_by: USER_ID,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      organizations: { name: "Test Org" },
    };

    db.__qb.resolveOnce({ data, error: null });

    const result = await createCampaign(db as never, {
      name: "Summer Blast",
      type: "email",
      organization_id: ORG_ID,
      created_by: USER_ID,
    });

    expect(result.name).toBe("Summer Blast");
    expect(result.organization_name).toBe("Test Org");
  });

  it("throws on insert error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Insert failed") });

    await expect(
      createCampaign(db as never, { name: "Camp", type: "email" }),
    ).rejects.toThrow("Insert failed");
  });
});

// ── updateCampaign ────────────────────────────────────────────────

describe("updateCampaign", () => {
  it("updates and returns the campaign", async () => {
    const data = {
      id: "camp-1",
      organization_id: ORG_ID,
      name: "Updated Campaign",
      type: "email",
      status: "active",
      target_count: 100,
      sent_count: 0,
      opened_count: 0,
      clicked_count: 0,
      created_by: USER_ID,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-02T00:00:00Z",
      organizations: { name: "Test Org" },
    };

    db.__qb.resolveOnce({ data, error: null });

    const result = await updateCampaign(db as never, "camp-1", {
      name: "Updated Campaign",
      status: "active",
    });

    expect(result.name).toBe("Updated Campaign");
    expect(result.status).toBe("active");
  });

  it("throws on update error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Update failed") });

    await expect(
      updateCampaign(db as never, "camp-1", { name: "Nope" }),
    ).rejects.toThrow("Update failed");
  });
});

// ── deleteCampaign ────────────────────────────────────────────────

describe("deleteCampaign", () => {
  it("deletes a campaign", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await deleteCampaign(db as never, "camp-1");

    expect(db.from).toHaveBeenCalled();
  });

  it("throws on delete error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Delete failed") });

    await expect(deleteCampaign(db as never, "camp-1")).rejects.toThrow(
      "Delete failed",
    );
  });
});

// ── getPlatformStats ──────────────────────────────────────────────

describe("getPlatformStats", () => {
  it("returns aggregated platform stats", async () => {
    db.__qb.resolveOnce({ data: null, count: 42, error: null });
    db.__qb.resolveOnce({
      data: [
        { plan_type: "free", status: "active" },
        { plan_type: "premium", status: "active" },
        { plan_type: "free", status: "trial" },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        { role: "super_admin" },
        { role: "seller" },
        { role: "marketing_manager" },
        { role: "seller" },
      ],
      error: null,
    });

    const result = await getPlatformStats(db as never);

    expect(result.total_orgs).toBe(42);
    expect(result.plans).toEqual({ free: 2, premium: 1 });
    expect(result.statuses).toEqual({ active: 2, trial: 1 });
    expect(result.sellers).toBe(2);
    expect(result.marketing_managers).toBe(1);
    expect(result.super_admins).toBe(1);
  });

  it("handles empty results", async () => {
    db.__qb.resolveOnce({ data: null, count: 0, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getPlatformStats(db as never);

    expect(result.total_orgs).toBe(0);
    expect(result.plans).toEqual({});
    expect(result.statuses).toEqual({});
    expect(result.sellers).toBe(0);
  });
});
