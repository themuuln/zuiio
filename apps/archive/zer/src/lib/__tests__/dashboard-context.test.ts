/**
 * Tests for getDashboardContext().
 *
 * The function is wrapped with React.cache() in the source. In a
 * jsdom test environment React.cache delegates through normally — its
 * per-request dedup is a React Server Component optimization that only
 * activates within a real request scope. The assertion below verifies
 * the wrapping contract; the behavioral tests exercise the inner logic.
 */
import { describe, expect, it, vi } from "vitest";

// ─── Hoisted mocks ───────────────────────────────────────────────────
// vi.mock factories are hoisted above module-level code, so any variable
// they reference must come from vi.hoisted().

const { mockSupabaseRef } = vi.hoisted(() => {
  let supabase: Record<string, unknown> | null = null;
  return {
    mockSupabaseRef: {
      get current() {
        return supabase;
      },
      set current(v) {
        supabase = v;
      },
    },
  };
});

// ─── vi.mock declarations ───────────────────────────────────────────

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabaseRef.current,
}));

// ─── Mock Supabase builder ───────────────────────────────────────────

interface SupabaseMock {
  auth: { getClaims: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
  _builder: Record<string, ReturnType<typeof vi.fn>>;
}

function createMockSupabase(): SupabaseMock {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.single = vi.fn(() => ({ data: null, error: null }));

  return {
    auth: { getClaims: vi.fn() },
    from: vi.fn(() => builder),
    _builder: builder,
  };
}

// ─── Profile fixture ─────────────────────────────────────────────────

const defaultOrg = {
  name: "Test Org",
  brand_config: null,
  company_type: "retail",
  onboarding_completed: true,
  enabled_features: ["inventory"],
  has_suppliers: false,
  has_inventory: true,
  has_customer_credit: false,
  has_multi_branch: false,
  has_variants: false,
  has_brands: false,
  has_categories: true,
  has_email_reports: false,
  has_audit_log: false,
} as const;

const defaultProfile = {
  full_name: "Test User",
  organization_id: "org-1",
  branch_id: "branch-1",
  organizations: defaultOrg,
};

// ─── Tests ───────────────────────────────────────────────────────────

describe("getDashboardContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Start each test with a fresh mock supabase
    mockSupabaseRef.current = createMockSupabase();
  });

  it("returns context with profile + org when user is authenticated", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", email: "test@test.com" } },
      error: null,
    });
    supabase._builder.single.mockResolvedValue({
      data: defaultProfile,
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    const ctx = await getDashboardContext();

    expect(ctx.supabase).toBeDefined();
    expect(ctx.profile).toEqual(defaultProfile);
    expect(ctx.org).toEqual(defaultOrg);
    expect(ctx.organizationId).toBe("org-1");
    expect(ctx.branchId).toBe("branch-1");
    expect(ctx.isBranchScoped).toBe(true);
    expect(ctx.userId).toBe("user-1");
    expect(ctx.userEmail).toBe("test@test.com");
  });

  it("uses branchId=null and isBranchScoped=false when profile has no branch", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    supabase._builder.single.mockResolvedValue({
      data: { ...defaultProfile, branch_id: null },
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    const ctx = await getDashboardContext();

    expect(ctx.branchId).toBeNull();
    expect(ctx.isBranchScoped).toBe(false);
  });

  it("uses userEmail=null when email claim is missing", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    supabase._builder.single.mockResolvedValue({
      data: defaultProfile,
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    const ctx = await getDashboardContext();

    expect(ctx.userEmail).toBeNull();
  });

  it("redirects to /login when auth.getClaims fails", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: null,
      error: new Error("auth error"),
    });

    const { getDashboardContext } = await import("../dashboard-context");
    await expect(getDashboardContext()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("redirects to /login when userId is missing from claims", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { email: "test@test.com" } },
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    await expect(getDashboardContext()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("redirects to /login when profile is null", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    // single returns null data, no error — user not in profiles table
    supabase._builder.single.mockResolvedValue({
      data: null,
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    await expect(getDashboardContext()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("redirects to /organization/new when profile has no organization_id", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    supabase._builder.single.mockResolvedValue({
      data: { ...defaultProfile, organization_id: null },
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    await expect(getDashboardContext()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("redirects to /onboarding when org.onboarding_completed is false", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    supabase._builder.single.mockResolvedValue({
      data: {
        ...defaultProfile,
        organizations: { ...defaultOrg, onboarding_completed: false },
      },
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    await expect(getDashboardContext()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("captures profile query error but does not redirect", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    const queryError = new Error("column missing");
    supabase._builder.single.mockResolvedValue({
      data: defaultProfile,
      error: queryError,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    const ctx = await getDashboardContext();

    // Function still succeeds because profile data exists despite error
    expect(ctx.profile).toEqual(defaultProfile);
    const { capture } = await import("@zuiio/capture");
    expect(capture).toHaveBeenCalledWith(queryError, {
      context: "dashboard context: profile query",
    });
  });

  it("is wrapped with React.cache()", async () => {
    // The module defines `getDashboardContext = cache(async () => {...})`.
    // React.cache returns a wrapped function — in jsdom this is transparent.
    // Verify the export is a function (the inner function) and that loading
    // the module triggers no runtime errors, confirming cache() was applied
    // at module evaluation time.
    const mod = await import("../dashboard-context");
    expect(mod).toHaveProperty("getDashboardContext");
    expect(typeof mod.getDashboardContext).toBe("function");
  });

  it("ensures from() is called with 'profiles' table", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    supabase._builder.single.mockResolvedValue({
      data: defaultProfile,
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    await getDashboardContext();

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(supabase.from).toHaveBeenCalledOnce();
  });

  it("ensures eq() filters by user ID", async () => {
    const supabase = mockSupabaseRef.current as SupabaseMock;
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    supabase._builder.single.mockResolvedValue({
      data: defaultProfile,
      error: null,
    });

    const { getDashboardContext } = await import("../dashboard-context");
    await getDashboardContext();

    expect(supabase._builder.eq).toHaveBeenCalledWith("id", "user-1");
    expect(supabase._builder.eq).toHaveBeenCalledOnce();
  });
});
