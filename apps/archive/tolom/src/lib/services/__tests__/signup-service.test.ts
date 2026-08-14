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

  it("seeds bilingual services, parts, suggestions, and labels from the preset", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    // .single() org insert → #1, .single() role fetch → #2
    // .single() branch → #3, membership → #4, profile → #5
    // services insert → #6 (select), parts insert → #7 (select),
    // suggestions insert → #8, labels insert → #9
    adminDb.__qb.resolveOnce({
      data: { id: ORG_ID },
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: { id: ROLE_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: { id: BRANCH_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({
      data: [
        { id: "svc-1", name: "Oil Change" },
        { id: "svc-2", name: "Brake Inspection & Replacement" },
      ],
      error: null,
    });
    adminDb.__qb.resolveOnce({
      data: [
        { id: "part-1", name: "Engine Oil 5W-30 (4L)" },
        { id: "part-2", name: "Engine Oil Filter" },
      ],
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await finalizeSignup(db as never, {
      businessType: "general_repair",
    });

    expect(result.status).toBe("created");

    // The shared query builder records every .insert() payload.
    const qb = adminDb.from.mock.results[0]?.value as {
      insert: ReturnType<typeof vi.fn>;
    };
    expect(qb).toBeDefined();
    const insertPayloads = (qb.insert.mock.calls as unknown[][][])
      .map((call) => call[0])
      .filter(
        (p): p is Record<string, unknown>[] =>
          Array.isArray(p) && p.length > 0 && typeof p[0] === "object",
      );

    // Services seeded with bilingual fields
    const serviceRows = insertPayloads.find((rows) =>
      rows.every((r) => r.category !== undefined && r.name_mn !== undefined),
    );
    expect(serviceRows).toBeDefined();
    if (!serviceRows) throw new Error("Service rows were not seeded");
    expect(serviceRows.length).toBeGreaterThan(0);
    expect(serviceRows[0]).toMatchObject({
      organization_id: ORG_ID,
      name: "Oil Change",
      name_mn: "Тос солих",
      category: "Тогтмол засвар үйлчилгээ",
      default_price: 85000,
      estimated_duration_minutes: 45,
      interval_months: 6,
      interval_km: 10000,
      is_active: true,
      created_by: USER_ID,
    });

    // Parts seeded
    const partRows = insertPayloads.find((rows) =>
      rows.every((r) => r.unit !== undefined && r.part_number !== undefined),
    );
    expect(partRows).toBeDefined();
    if (!partRows) throw new Error("Part rows were not seeded");
    expect(partRows.length).toBeGreaterThan(0);
    const oilPart = partRows.find((r) => r.name === "Engine Oil 5W-30 (4L)");
    expect(oilPart).toBeDefined();
    expect(oilPart).toMatchObject({
      organization_id: ORG_ID,
      name: "Engine Oil 5W-30 (4L)",
      name_mn: "Хөдөлгүүрийн тос 5W-30 (4л)",
      category: "Engine",
      default_price: 45000,
    });

    // Service → part suggestions seeded with resolved ids
    const suggestionRows = insertPayloads.find((rows) =>
      rows.every((r) => r.service_id !== undefined && r.part_id !== undefined),
    );
    expect(suggestionRows).toBeDefined();
    if (!suggestionRows) throw new Error("Suggestion rows were not seeded");
    expect(suggestionRows.length).toBeGreaterThan(0);
    expect(suggestionRows[0]).toMatchObject({
      organization_id: ORG_ID,
      service_id: "svc-1",
      part_id: "part-1",
      quantity: 1,
      created_by: USER_ID,
    });
    // Every suggestion maps to a real service/part id (no orphans)
    for (const row of suggestionRows) {
      expect(row.service_id).toBeTruthy();
      expect(row.part_id).toBeTruthy();
    }

    // Diagnosis labels seeded with Mongolian names
    const labelRows = insertPayloads.find((rows) =>
      rows.every((r) => r.sort_order !== undefined && r.name_mn !== undefined),
    );
    expect(labelRows).toBeDefined();
    if (!labelRows) throw new Error("Label rows were not seeded");
    expect(labelRows.length).toBeGreaterThan(0);
    expect(labelRows[0]).toMatchObject({
      organization_id: ORG_ID,
      name: "Engine",
      name_mn: "Хөдөлгүүр",
      sort_order: 0,
      is_active: true,
    });
  });

  it("skips suggestion seeding when enablePartSuggestions is false", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    // org insert → #1, role → #2, branch → #3, membership → #4,
    // profile → #5, services → #6, parts → #7, labels → #8
    // (no suggestions insert — feature disabled)
    adminDb.__qb.resolveOnce({
      data: { id: ORG_ID, settings: { enable_part_suggestions: false } },
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: { id: ROLE_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: { id: BRANCH_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({
      data: [{ id: "svc-1", name: "Oil Change" }],
      error: null,
    });
    adminDb.__qb.resolveOnce({
      data: [{ id: "part-1", name: "Engine Oil Filter" }],
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await finalizeSignup(db as never, {
      businessType: "general_repair",
      enablePartSuggestions: false,
    });

    expect(result.status).toBe("created");

    const qb = adminDb.from.mock.results[0]?.value as {
      insert: ReturnType<typeof vi.fn>;
    };
    const insertPayloads = (qb.insert.mock.calls as unknown[][][])
      .map((call) => call[0])
      .filter(
        (p): p is Record<string, unknown>[] =>
          Array.isArray(p) && p.length > 0 && typeof p[0] === "object",
      );

    // No suggestion rows (no payload with service_id + part_id)
    const suggestionRows = insertPayloads.find((rows) =>
      rows.every((r) => r.service_id !== undefined && r.part_id !== undefined),
    );
    expect(suggestionRows).toBeUndefined();

    // Org settings carry the flag (org insert is a single-object payload)
    const orgInsert = (qb.insert.mock.calls as unknown[][][]).find(
      (call) =>
        !Array.isArray(call[0]) &&
        (call[0] as Record<string, unknown>)?.settings !== undefined,
    )?.[0] as Record<string, unknown> | undefined;
    expect(orgInsert?.settings).toMatchObject({
      business_type: "general_repair",
      enable_part_suggestions: false,
    });
  });

  it("reports but does not throw when service seeding fails", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    adminDb.__qb.resolveOnce({
      data: { id: ORG_ID },
      error: null,
    });
    adminDb.__qb.resolveOnce({ data: { id: ROLE_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: { id: BRANCH_ID }, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({
      data: null,
      error: new Error("Service insert failed"),
    });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.__qb.resolveOnce({ data: null, error: null });
    adminDb.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await finalizeSignup(db as never, {
      businessType: "general_repair",
    });

    expect(result.status).toBe("created");
    expect(mockReportServerError).toHaveBeenCalledWith(
      expect.stringContaining("default services"),
      "Service insert failed",
    );
  });
});
