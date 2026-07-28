import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

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
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));
vi.mock("@zuiio/core", () => ({
  generateUUID: vi.fn().mockReturnValue("abc12345-def0-1234-5678-123456789abc"),
}));

import { AppError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockReportServerError = vi.mocked(reportServerError);

import { finalizeSignup } from "../signup-service";

const USER_ID = "user-1";
const ORG_ID = "org-1";
const ROLE_ID = "role-1";
const BRANCH_ID = "branch-1";

let db: MockSupabaseClient;
let adminDb: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  adminDb = createMockSupabaseClient();
  mockCreateServiceRoleClient.mockResolvedValue(adminDb as never);
});

// ── finalizeSignup ────────────────────────────────────────────────

describe("finalizeSignup", () => {
  const authUser = {
    id: USER_ID,
    email: "user@example.com",
    user_metadata: { full_name: "Test User" },
  };

  it("creates a new organization and returns 'created'", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    // .single() org insert → #1, .single() role fetch → #2
    // .single() branch → #3, await qb (membership upsert) → #4, await qb (profile upsert) → #5
    adminDb.__qb.resolveOnce({
      data: {
        id: ORG_ID,
        name: "Shop of user@example.com",
        slug: "shop-of-user-example-com",
      },
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: { id: ROLE_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: { id: BRANCH_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await finalizeSignup(db as never);

    expect(result.status).toBe("created");
    expect(adminDb.rpc).toHaveBeenCalledWith("create_default_subscription", {
      target_org_id: ORG_ID,
    });
  });

  it("returns 'already_setup' when user already has a membership", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });
    // maybeSingle (membership) returns org data via mockResolvedValueOnce
    adminDb.from("organization_users").maybeSingle.mockResolvedValueOnce({
      data: { organization_id: ORG_ID },
      error: null,
    });
    // Profile upsert
    adminDb.__qb.resolveOnce({ data: null, error: null });

    const result = await finalizeSignup(db as never);

    expect(result.status).toBe("already_setup");
  });

  it("throws AppError when user is not authenticated", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: new Error("No session"),
    });

    await expect(finalizeSignup(db as never)).rejects.toThrow(AppError);
  });

  it("uses orgName from options when provided", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    // .single() org insert → #1, .single() role fetch → #2
    // .single() branch → #3, await qb (membership upsert) → #4, await qb (profile upsert) → #5
    adminDb.__qb.resolveOnce({
      data: { id: ORG_ID, name: "My Custom Shop", slug: "my-custom-shop" },
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: { id: ROLE_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: { id: BRANCH_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await finalizeSignup(db as never, {
      orgName: "My Custom Shop",
    });

    expect(result.status).toBe("created");
  });

  it("throws on org creation failure", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    // maybeSingle returns default null for membership + slug checks
    // .single() org insert → #1 → error
    adminDb.__qb.resolveOnce({
      data: null,
      error: new Error("Org insert failed"),
    });

    await expect(finalizeSignup(db as never)).rejects.toThrow(
      "Org insert failed",
    );
  });

  it("throws on Org Owner role resolution failure", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    // maybeSingle returns default null for membership + slug checks
    // .single() org insert → #1 → success, .single() role fetch → #2 → null data
    adminDb.__qb.resolveOnce({
      data: { id: ORG_ID },
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: null, error: null });

    await expect(finalizeSignup(db as never)).rejects.toThrow("Org Owner role");
  });

  it("reports but does not throw on profile upsert error", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    // maybeSingle (membership) returns org data via mockResolvedValueOnce
    adminDb.from("organization_users").maybeSingle.mockResolvedValueOnce({
      data: { organization_id: ORG_ID },
      error: null,
    });
    // Profile upsert → error
    adminDb.__qb.resolveOnce({
      data: null,
      error: new Error("Profile upsert failed"),
    });

    const result = await finalizeSignup(db as never);

    expect(result.status).toBe("already_setup");
    expect(mockReportServerError).toHaveBeenCalled();
  });

  it("falls back to email-based org name when no metadata", async () => {
    const userWithoutMeta = {
      id: USER_ID,
      email: "shopkeeper@example.com",
      user_metadata: {},
    };
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: userWithoutMeta },
      error: null,
    });

    // .single() org insert → #1, .single() role fetch → #2
    // .single() branch → #3, await qb (membership upsert) → #4, await qb (profile upsert) → #5
    adminDb.__qb.resolveOnce({
      data: { id: ORG_ID, name: "Shop of shopkeeper@example.com" },
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: { id: ROLE_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: { id: BRANCH_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await finalizeSignup(db as never);

    expect(result.status).toBe("created");
  });

  it("reports subscription creation failure without throwing", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    // .single() org insert → #1, .single() role fetch → #2
    // .single() branch → #3, await qb (membership upsert) → #4, await qb (profile upsert) → #5
    adminDb.__qb.resolveOnce({
      data: { id: ORG_ID },
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: { id: ROLE_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: { id: BRANCH_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.rpc = vi.fn().mockRejectedValue(new Error("RPC failed"));

    const result = await finalizeSignup(db as never);

    expect(result.status).toBe("created");
    expect(mockReportServerError).toHaveBeenCalled();
  });
});
