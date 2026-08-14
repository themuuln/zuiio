import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  ConflictError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ConflictError";
    }
  },
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { reportServerError } from "@/lib/sentry-report-server";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockReportServerError = vi.mocked(reportServerError);

import {
  createOrganization,
  getOrganization,
  getUserOrganization,
  updateOrganization,
} from "../organization-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const SLUG = "test-org";

function makeOrgRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ORG_ID,
    name: "Test Org",
    slug: SLUG,
    logo_url: null,
    settings: { language: "mn" },
    is_active: true,
    sharing_enabled: false,
    branch_limit: null,
    created_by: USER_ID,
    updated_by: USER_ID,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  // Default resolve for unwired await qb calls
  db.__qb.resolveWith({ data: null, error: null });
});

// ── createOrganization ──────────────────────────────────────────────

describe("createOrganization", () => {
  const params = { name: "Test Org", slug: SLUG, userFullName: "Test User" };
  const orgRow = makeOrgRow();

  it("creates an organization with all default setup", async () => {
    // Step 2: org insert .single()
    db.__qb.resolveOnce({ data: orgRow, error: null });
    // Step 3: role query .single() → Org Owner role
    db.__qb.resolveOnce({ data: { id: "role-1" }, error: null });
    // Step 4: branch insert .single() → new branch
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    // Step 5: settings insert
    db.__qb.resolveOnce({ data: null, error: null });
    // Step 6: member insert
    db.__qb.resolveOnce({ data: null, error: null });
    // Step 7: profile upsert
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await createOrganization(db as never, params, USER_ID);

    expect(result).toMatchObject({ id: ORG_ID, name: "Test Org", slug: SLUG });
    expect(db.from).toHaveBeenCalledWith("organization_settings");
    expect(db.from).toHaveBeenCalledWith("organization_users");
    expect(db.from).toHaveBeenCalledWith("profiles");
    expect(db.from).toHaveBeenCalledWith("branches");
    expect(db.rpc).toHaveBeenCalledWith("create_default_subscription", {
      target_org_id: ORG_ID,
    });
  });

  it("throws ValidationError when name is empty", async () => {
    await expect(
      createOrganization(db as never, { ...params, name: "" }, USER_ID),
    ).rejects.toThrow("Organization name is required");
  });

  it("throws ValidationError when slug is missing", async () => {
    await expect(
      createOrganization(db as never, { ...params, slug: "" }, USER_ID),
    ).rejects.toThrow("Organization slug is required");
  });

  it("throws ConflictError when slug already exists", async () => {
    // maybeSingle returns existing org — override the default mockResolvedValue
    const spy = db.from("organizations").maybeSingle;
    spy.mockResolvedValueOnce({
      data: { id: "existing-org" },
      error: null,
    });
    await expect(
      createOrganization(db as never, params, USER_ID),
    ).rejects.toThrow("An organization with this slug already exists");
  });

  it("throws Error when org insert fails", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "Insert failed" } });

    await expect(
      createOrganization(db as never, params, USER_ID),
    ).rejects.toThrow("Insert failed");
  });

  it("throws Error when role fetch fails after org insert", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Role query failed" },
    });

    await expect(
      createOrganization(db as never, params, USER_ID),
    ).rejects.toThrow("Role query failed");
  });

  it("throws Error when member insert fails", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });
    db.__qb.resolveOnce({ data: { id: "role-1" }, error: null });
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Member insert failed" },
    });

    await expect(
      createOrganization(db as never, params, USER_ID),
    ).rejects.toThrow("Member insert failed");
  });

  it("reports but does not throw when settings insert fails", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });
    db.__qb.resolveOnce({ data: { id: "role-1" }, error: null });
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Settings insert failed" },
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await createOrganization(db as never, params, USER_ID);

    expect(result.id).toBe(ORG_ID);
    expect(mockReportServerError).toHaveBeenCalled();
  });

  it("reports but does not throw when subscription rpc fails", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });
    db.__qb.resolveOnce({ data: { id: "role-1" }, error: null });
    db.__qb.resolveOnce({ data: { id: "branch-1" }, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    vi.mocked(db.rpc).mockRejectedValueOnce(new Error("Subscription failed"));

    const result = await createOrganization(db as never, params, USER_ID);

    expect(result.id).toBe(ORG_ID);
    expect(mockReportServerError).toHaveBeenCalled();
  });
});

// ── getOrganization ───────────────────────────────────────────────

describe("getOrganization", () => {
  it("returns an organization by id", async () => {
    db.__qb.resolveOnce({ data: makeOrgRow(), error: null });

    const result = await getOrganization(db as never, ORG_ID);

    expect(result).toMatchObject({ id: ORG_ID, name: "Test Org" });
    expect(db.from).toHaveBeenCalledWith("organizations");
  });

  it("throws NotFoundError when org does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(getOrganization(db as never, ORG_ID)).rejects.toThrow(
      "Organization not found",
    );
  });

  it("throws NotFoundError when DB returns an error", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "DB error" } });

    await expect(getOrganization(db as never, ORG_ID)).rejects.toThrow(
      "Organization not found",
    );
  });

  it("filters out deleted organizations", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(getOrganization(db as never, ORG_ID)).rejects.toThrow(
      "Organization not found",
    );

    expect(db.from("organizations").is).toHaveBeenCalledWith(
      "deleted_at",
      null,
    );
  });
});

// ── getUserOrganization ───────────────────────────────────────────

describe("getUserOrganization", () => {
  const orgData = {
    id: ORG_ID,
    name: "Test Org",
    slug: SLUG,
    logo_url: null,
    settings: { language: "mn" },
    is_active: true,
    branch_limit: null,
    created_at: "2026-01-15T10:00:00Z",
  };

  it("returns the user's organization", async () => {
    db.from("organization_users").maybeSingle.mockResolvedValue({
      data: {
        organization_id: ORG_ID,
        organizations: orgData,
      },
      error: null,
    });

    const result = await getUserOrganization(db as never, USER_ID);

    expect(result).toMatchObject({ id: ORG_ID, name: "Test Org" });
    expect(db.from).toHaveBeenCalledWith("organization_users");
  });

  it("returns null when user has no organization", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getUserOrganization(db as never, USER_ID);

    expect(result).toBeNull();
  });

  it("filters out removed memberships", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getUserOrganization(db as never, USER_ID);

    expect(result).toBeNull();
    expect(db.from("organization_users").is).toHaveBeenCalledWith(
      "removed_at",
      null,
    );
  });
});

// ── updateOrganization ────────────────────────────────────────────

describe("updateOrganization", () => {
  const orgRow = makeOrgRow({ name: "Updated Org" });

  it("updates an organization with userId_ provided", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });

    const result = await updateOrganization(
      db as never,
      ORG_ID,
      { name: "Updated Org" },
      USER_ID,
    );

    expect(result).toMatchObject({ id: ORG_ID, name: "Updated Org" });
    expect(db.from("organizations").update).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "organizations",
        record_id: ORG_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      expect.stringContaining(ORG_ID),
      "max",
    );
  });

  it("resolves updated_by from auth.getUser when userId_ is omitted", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });

    const result = await updateOrganization(db as never, ORG_ID, {
      name: "Updated Org",
    });

    expect(result.id).toBe(ORG_ID);
    expect(db.auth.getUser).toHaveBeenCalled();
  });

  it("throws ValidationError when no fields to update", async () => {
    await expect(
      updateOrganization(db as never, ORG_ID, {}, USER_ID),
    ).rejects.toThrow("No fields to update");
  });

  it("throws NotFoundError when org does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateOrganization(db as never, ORG_ID, { name: "Updated Org" }, USER_ID),
    ).rejects.toThrow("Organization not found");
  });

  it("throws NotFoundError when DB returns an error", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "Update failed" } });

    await expect(
      updateOrganization(db as never, ORG_ID, { name: "Updated Org" }, USER_ID),
    ).rejects.toThrow("Organization not found");
  });

  it("passes trimmed name to the update", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });

    await updateOrganization(
      db as never,
      ORG_ID,
      { name: "   Updated Org   " },
      USER_ID,
    );

    const updateArgs = db.from("organizations").update.mock.calls;
    expect(updateArgs[0]?.[0]).toHaveProperty("name", "Updated Org");
  });

  it("clears logo_url when null is passed", async () => {
    db.__qb.resolveOnce({ data: { ...orgRow, logo_url: null }, error: null });

    await updateOrganization(db as never, ORG_ID, { logoUrl: null }, USER_ID);

    const updateArgs = db.from("organizations").update.mock.calls;
    expect(updateArgs[0]?.[0]).toHaveProperty("logo_url", null);
  });

  it("syncs known settings keys into organization_settings", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });

    await updateOrganization(
      db as never,
      ORG_ID,
      {
        name: "Updated Org",
        settings: {
          ndsh_enabled: true,
          ndsh_employer_rate: 11.5,
          einvoice_api_key: undefined,
          custom_key: "ignored",
        },
      },
      USER_ID,
    );

    expect(db.from).toHaveBeenCalledWith("organization_settings");
    const upsertArgs = db.from("organization_settings").upsert.mock.calls;
    expect(upsertArgs[0]?.[0]).toMatchObject({
      organization_id: ORG_ID,
      ndsh_enabled: true,
      ndsh_employer_rate: 11.5,
      einvoice_api_key: null, // undefined → null (key cleared)
    });
    expect(upsertArgs[0]?.[0]).not.toHaveProperty("custom_key");
    expect(upsertArgs[0]?.[1]).toEqual({ onConflict: "organization_id" });
  });

  it("does not touch organization_settings when settings has no known keys", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });

    await updateOrganization(
      db as never,
      ORG_ID,
      { name: "X", settings: { custom_key: "v" } },
      USER_ID,
    );

    expect(db.from("organization_settings").upsert).not.toHaveBeenCalled();
  });

  it("does not touch organization_settings when settings omitted", async () => {
    db.__qb.resolveOnce({ data: orgRow, error: null });

    await updateOrganization(db as never, ORG_ID, { name: "X" }, USER_ID);

    expect(db.from("organization_settings").upsert).not.toHaveBeenCalled();
  });
});
