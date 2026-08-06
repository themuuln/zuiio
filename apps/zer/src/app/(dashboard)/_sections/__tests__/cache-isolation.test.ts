import { describe, expect, it, vi } from "vitest";

// ─── Mock Supabase builder ────────────────────────────────────────────

interface MockBuilder {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  _builder: Record<string, ReturnType<typeof vi.fn>>;
}

function createMockSupabase(): MockBuilder {
  const self: Record<string, ReturnType<typeof vi.fn>> = {};
  self.select = vi.fn(() => self);
  self.eq = vi.fn(() => self);
  self.gte = vi.fn(() => self);
  self.lt = vi.fn(() => self);
  self.order = vi.fn(() => self);
  self.limit = vi.fn(() => self);
  self.single = vi.fn(() => ({ data: null, error: null }));
  self.maybeSingle = vi.fn(() => ({ data: null, error: null }));
  self.rpc = vi.fn(() => self);
  return { from: vi.fn(() => self), rpc: self.rpc, _builder: self };
}

// ─── Wire mocks ───────────────────────────────────────────────────────

let mockSupabase: MockBuilder = createMockSupabase();

vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: () => mockSupabase,
}));

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
  withDbCapture: vi.fn((_label: string, query: unknown) => query),
}));

vi.mock("@/lib/branches", () => ({
  withBranchFilter: vi.fn((query: unknown) => query),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

function getEqCalls(): Array<[string, unknown]> {
  const builder = mockSupabase._builder;
  return builder.eq.mock.calls.map(
    ([key, val]: [string, unknown]) => [key, val] as [string, unknown],
  );
}

function getRpcArgs(): Record<string, unknown> | undefined {
  const calls = mockSupabase.rpc.mock.calls as Array<
    [string, Record<string, unknown>]
  >;
  if (calls.length === 0) return undefined;
  const [, args] = calls[0];
  return args;
}

// ─── Tests: monthly-trend-section ─────────────────────────────────────

describe("MonthlyTrendSection", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("filters by the provided organizationId", async () => {
    const { MonthlyTrendSection } = await import("../monthly-trend-section");
    await MonthlyTrendSection({
      orgId: "org-A",
      branchId: null,
      isBranchScoped: false,
    });

    const eqCalls = getEqCalls();
    const orgFilter = eqCalls.find(([key]) => key === "organization_id");
    expect(orgFilter).toBeDefined();
    expect(orgFilter?.[1]).toBe("org-A");
  });

  it("does not leak cross-org data", async () => {
    const { MonthlyTrendSection } = await import("../monthly-trend-section");
    await MonthlyTrendSection({
      orgId: "org-A",
      branchId: null,
      isBranchScoped: false,
    });

    const eqCalls = getEqCalls();
    const wrongOrg = eqCalls.find(
      ([key, val]) => key === "organization_id" && val !== "org-A",
    );
    expect(wrongOrg).toBeUndefined();
  });
});

// ─── Tests: quick-shortcuts ───────────────────────────────────────────

describe("QuickShortcuts", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("passes organizationId to the RPC call", async () => {
    const { QuickShortcuts } = await import("../quick-shortcuts");
    await QuickShortcuts({ orgId: "org-B" });

    const rpcArgs = getRpcArgs();
    expect(rpcArgs).toBeDefined();
    expect(rpcArgs?.p_organization_id).toBe("org-B");
  }, 10_000);

  it("does not use a hardcoded orgId", async () => {
    const { QuickShortcuts } = await import("../quick-shortcuts");
    await QuickShortcuts({ orgId: "org-X" });

    const rpcArgs = getRpcArgs();
    expect(rpcArgs?.p_organization_id).toBe("org-X");
  }, 10_000);
});

// ─── Tests: recent-sales ──────────────────────────────────────────────

describe("RecentSales", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it("filters by the provided organizationId", async () => {
    const { RecentSales } = await import("../recent-sales");
    await RecentSales({
      orgId: "org-C",
      branchId: null,
      isBranchScoped: false,
    });

    const eqCalls = getEqCalls();
    const orgFilter = eqCalls.find(([key]) => key === "organization_id");
    expect(orgFilter).toBeDefined();
    expect(orgFilter?.[1]).toBe("org-C");
  });

  it("does not leak cross-org data", async () => {
    const { RecentSales } = await import("../recent-sales");
    await RecentSales({
      orgId: "org-C",
      branchId: null,
      isBranchScoped: false,
    });

    const eqCalls = getEqCalls();
    const wrongOrg = eqCalls.find(
      ([key, val]) => key === "organization_id" && val !== "org-C",
    );
    expect(wrongOrg).toBeUndefined();
  });
});
