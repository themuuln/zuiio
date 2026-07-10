import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  getMechanicKpis,
  getMechanicPerformanceTrend,
  getMechanicsList,
} from "./mechanics";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((_fn: unknown, _key: unknown) => _fn as Function),
}));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: (_keyParts: unknown, fn: Function) => fn(),
}));

/**
 * Creates an independent mock query builder.
 * Each from() call must get its own builder so .then() resolves independently.
 */
function makeBuilder<T = unknown>(data?: T) {
  const resolved = { data: data ?? null, error: null };
  const builder: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    // biome-ignore lint/suspicious/noThenProperty: necessary to mock thenable Supabase query builder
    then: vi.fn((resolve: (v: typeof resolved) => void) => resolve(resolved)),
  };
  // single() — terminal method. Delegates to then() so mockResolvedValueOnce on
  // single doesn't fight with the thenable. This way a single builder can serve
  // chains ending in .single() OR plain await.
  builder.single = vi.fn(() => new Promise((resolve) => builder.then(resolve)));
  builder.maybeSingle = vi.fn(
    () => new Promise((resolve) => builder.then(resolve)),
  );
  return builder;
}

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

// ── getMechanicKpis ─────────────────────────────────────────

describe("getMechanicKpis", () => {
  it("returns empty array when woIds is empty", async () => {
    const result = await getMechanicKpis(mockClient as any, "org-1", []);
    expect(result).toEqual([]);
  });

  it("returns empty array when no work orders have a mechanic assigned", async () => {
    const builder = makeBuilder([]);
    mockClient.from = vi.fn().mockReturnValue(builder);

    const result = await getMechanicKpis(mockClient as any, "org-1", ["wo-1"]);
    expect(result).toEqual([]);
  });

  it("computes KPIs for a single mechanic with multiple work orders", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // work_orders → mechanic lookup
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { id: "wo-1", mechanic_id: "mech-1" },
                { id: "wo-2", mechanic_id: "mech-1" },
              ],
              error: null,
            }),
          );
          break;
        case 2: // profiles
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [{ id: "mech-1", full_name: "John Doe" }],
              error: null,
            }),
          );
          break;
        case 3: // work_order_services
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { final_price: 100, work_order_id: "wo-1" },
                { final_price: 200, work_order_id: "wo-2" },
              ],
              error: null,
            }),
          );
          break;
        case 4: // work_order_parts
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [{ final_price: 50, work_order_id: "wo-1" }],
              error: null,
            }),
          );
          break;
        case 5: // service_completion_data
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                {
                  work_order_id: "wo-1",
                  customer_satisfaction: 5,
                  customer_feedback: "Great work",
                  created_at: "2026-01-10T10:00:00Z",
                },
              ],
              error: null,
            }),
          );
          break;
        case 6: // work_orders → customer lookup
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { id: "wo-1", customer_id: "cust-1" },
                { id: "wo-2", customer_id: null },
              ],
              error: null,
            }),
          );
          break;
        case 7: // customers
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [{ id: "cust-1", first_name: "Jane", last_name: "Smith" }],
              error: null,
            }),
          );
          break;
        default:
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicKpis(mockClient as any, "org-1", [
      "wo-1",
      "wo-2",
    ]);

    expect(result).toHaveLength(1);
    const kpi = result[0];
    expect(kpi.mechanic_id).toBe("mech-1");
    expect(kpi.mechanic_name).toBe("John Doe");
    expect(kpi.work_orders_completed).toBe(2);
    expect(kpi.services_count).toBe(2);
    expect(kpi.parts_count).toBe(1);
    expect(kpi.total_revenue).toBe(350); // 100+200+50
    expect(kpi.avg_revenue_per_wo).toBe(175); // 350/2
    expect(kpi.avg_satisfaction).toBe(5);
    expect(kpi.total_reviews).toBe(1);
    expect(kpi.recent_reviews).toHaveLength(1);
    expect(kpi.recent_reviews[0].customer_name).toBe("Jane Smith");
    expect(kpi.recent_reviews[0].rating).toBe(5);
  });

  it("computes KPIs for multiple mechanics sorted by revenue descending", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // work_orders
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { id: "wo-1", mechanic_id: "mech-1" },
                { id: "wo-2", mechanic_id: "mech-2" },
              ],
              error: null,
            }),
          );
          break;
        case 2: // profiles
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { id: "mech-1", full_name: "Alice" },
                { id: "mech-2", full_name: "Bob" },
              ],
              error: null,
            }),
          );
          break;
        case 3: // services — mech-2 has more revenue
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { final_price: 100, work_order_id: "wo-1" },
                { final_price: 500, work_order_id: "wo-2" },
              ],
              error: null,
            }),
          );
          break;
        default: // parts, completion, customers — empty
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicKpis(mockClient as any, "org-1", [
      "wo-1",
      "wo-2",
    ]);

    expect(result).toHaveLength(2);
    // Sorted by total_revenue descending — Bob (500) before Alice (100)
    expect(result[0].mechanic_name).toBe("Bob");
    expect(result[0].total_revenue).toBe(500);
    expect(result[1].mechanic_name).toBe("Alice");
    expect(result[1].total_revenue).toBe(100);
  });

  it("returns null avg_satisfaction when no completion data exists", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // work_orders → mechanic lookup
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [{ id: "wo-1", mechanic_id: "mech-1" }],
              error: null,
            }),
          );
          break;
        case 2: // profiles
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [{ id: "mech-1", full_name: "Solo" }],
              error: null,
            }),
          );
          break;
        case 3: // services
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [{ final_price: 200, work_order_id: "wo-1" }],
              error: null,
            }),
          );
          break;
        default: // parts, completion, customers — empty
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicKpis(mockClient as any, "org-1", ["wo-1"]);

    expect(result).toHaveLength(1);
    expect(result[0].avg_satisfaction).toBeNull();
    expect(result[0].total_reviews).toBe(0);
    expect(result[0].recent_reviews).toHaveLength(0);
  });

  it("calls correct Supabase tables with proper filters", async () => {
    const builder = makeBuilder([]);
    mockClient.from = vi.fn().mockReturnValue(builder);

    await getMechanicKpis(mockClient as any, "org-1", ["wo-1", "wo-2"]);

    expect(mockClient.from).toHaveBeenCalledWith("work_orders");
    expect(builder.select).toHaveBeenCalledWith("id, mechanic_id");
    expect(builder.in).toHaveBeenCalledWith("id", ["wo-1", "wo-2"]);
    expect(builder.not).toHaveBeenCalledWith("mechanic_id", "is", null);
  });
});

// ── getMechanicsList ─────────────────────────────────────────

describe("getMechanicsList", () => {
  it("returns mechanics with profiles for the organization", async () => {
    let callIndex = 0;
    const builders: ReturnType<typeof makeBuilder>[] = [];
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      builders.push(builder);
      switch (callIndex) {
        case 1: // organization_users with role join
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                {
                  user_id: "user-1",
                  roles: { name: "Mechanic" },
                  branch_id: "branch-1",
                },
                {
                  user_id: "user-2",
                  roles: { name: "Mechanic" },
                  branch_id: "branch-1",
                },
              ],
              error: null,
            }),
          );
          break;
        case 2: // profiles
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                {
                  id: "user-1",
                  full_name: "Alice Mechanic",
                  avatar_url: "https://example.com/alice.jpg",
                },
                {
                  id: "user-2",
                  full_name: "Bob Technician",
                  avatar_url: null,
                },
              ],
              error: null,
            }),
          );
          break;
        default:
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "user-1",
      full_name: "Alice Mechanic",
      avatar_url: "https://example.com/alice.jpg",
    });
    expect(result[1]).toEqual({
      id: "user-2",
      full_name: "Bob Technician",
      avatar_url: null,
    });

    // Verify the org_users query was made
    expect(mockClient.from).toHaveBeenCalledWith("organization_users");
    expect(builders[0].select).toHaveBeenCalledWith(
      "user_id, roles!inner(name), branch_id",
    );
  });

  it("returns empty array when no mechanics exist", async () => {
    const builder = makeBuilder([]);
    mockClient.from = vi.fn().mockReturnValue(builder);

    const result = await getMechanicsList(mockClient as any, "org-1");

    expect(result).toEqual([]);
  });

  it("filters mechanics by branch when branchId is provided", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // organization_users — returns mechanics from multiple branches
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                {
                  user_id: "user-1",
                  roles: { name: "Mechanic" },
                  branch_id: "branch-1",
                },
                {
                  user_id: "user-2",
                  roles: { name: "Mechanic" },
                  branch_id: "branch-2",
                },
              ],
              error: null,
            }),
          );
          break;
        case 2: // profiles — only the filtered mechanic (branch-1)
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                {
                  id: "user-1",
                  full_name: "Branch One Mech",
                  avatar_url: null,
                },
              ],
              error: null,
            }),
          );
          break;
        default:
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicsList(
      mockClient as any,
      "org-1",
      "branch-1",
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("user-1");
    expect(result[0].full_name).toBe("Branch One Mech");
  });

  it("returns empty when no mechanics match the branch filter", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // organization_users — only mechanics from other branch
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                {
                  user_id: "user-1",
                  roles: { name: "Mechanic" },
                  branch_id: "branch-2",
                },
              ],
              error: null,
            }),
          );
          break;
        default:
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicsList(
      mockClient as any,
      "org-1",
      "branch-1",
    );

    expect(result).toEqual([]);
  });
});

// ── getMechanicPerformanceTrend ──────────────────────────────

describe("getMechanicPerformanceTrend", () => {
  it("computes weekly trend grouped by ISO week", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // profiles → mechanic name (uses .single())
          builder.then = vi.fn((resolve) =>
            resolve({
              data: { full_name: "John Mechanic" },
              error: null,
            }),
          );
          break;
        case 2: // work_orders → completed orders (plain await, uses thenable)
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { id: "wo-1", created_at: "2026-01-06T12:00:00Z" },
                { id: "wo-2", created_at: "2026-01-07T12:00:00Z" },
                { id: "wo-3", created_at: "2026-01-08T12:00:00Z" },
                { id: "wo-4", created_at: "2026-01-09T12:00:00Z" },
              ],
              error: null,
            }),
          );
          break;
        case 3: // work_order_services
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { final_price: 100, work_order_id: "wo-1" },
                { final_price: 200, work_order_id: "wo-2" },
                { final_price: 150, work_order_id: "wo-3" },
                { final_price: 50, work_order_id: "wo-4" },
              ],
              error: null,
            }),
          );
          break;
        case 4: // work_order_parts
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
          break;
        default:
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicPerformanceTrend(
      mockClient as any,
      "org-1",
      "mech-1",
      "weekly",
      "2026-01-01",
      "2026-01-31",
    );

    expect(result.id).toBe("mech-1");
    expect(result.name).toBe("John Mechanic");
    expect(result.completedOrders).toBe(4);
    expect(result.revenue).toBe(500); // 100+200+150+50
    expect(result.avgJobValue).toBe(125); // 500/4

    // All 4 orders should be grouped into a single week
    expect(result.weeklyTrend).toHaveLength(1);
    expect(result.weeklyTrend?.[0].orders).toBe(4);
    expect(result.weeklyTrend?.[0].revenue).toBe(500);
  });

  it("computes monthly trend grouped by YYYY-MM", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // profiles
          builder.then = vi.fn((resolve) =>
            resolve({ data: { full_name: "Monthly Mech" }, error: null }),
          );
          break;
        case 2: // work_orders
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { id: "wo-1", created_at: "2026-02-01T10:00:00Z" },
                { id: "wo-2", created_at: "2026-02-15T10:00:00Z" },
                { id: "wo-3", created_at: "2026-02-20T10:00:00Z" },
                { id: "wo-4", created_at: "2026-02-28T10:00:00Z" },
              ],
              error: null,
            }),
          );
          break;
        case 3: // services
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { final_price: 250, work_order_id: "wo-1" },
                { final_price: 250, work_order_id: "wo-2" },
                { final_price: 250, work_order_id: "wo-3" },
                { final_price: 250, work_order_id: "wo-4" },
              ],
              error: null,
            }),
          );
          break;
        default: // parts — empty
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicPerformanceTrend(
      mockClient as any,
      "org-1",
      "mech-2",
      "monthly",
      "2026-02-01",
      "2026-02-28",
    );

    expect(result.completedOrders).toBe(4);
    expect(result.revenue).toBe(1000); // 250*4
    expect(result.weeklyTrend).toHaveLength(1);
    expect(result.weeklyTrend?.[0].week).toBe("2026-02");
    expect(result.weeklyTrend?.[0].orders).toBe(4);
    expect(result.weeklyTrend?.[0].revenue).toBe(1000);
  });

  it("returns zero revenue and orders when no completed work orders exist", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // profiles
          builder.then = vi.fn((resolve) =>
            resolve({ data: { full_name: "Idle Mechanic" }, error: null }),
          );
          break;
        case 2: // work_orders — empty
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
          break;
        default:
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicPerformanceTrend(
      mockClient as any,
      "org-1",
      "mech-3",
      "weekly",
      "2026-01-01",
      "2026-01-31",
    );

    expect(result.name).toBe("Idle Mechanic");
    expect(result.completedOrders).toBe(0);
    expect(result.revenue).toBe(0);
    expect(result.avgJobValue).toBe(0);
    expect(result.weeklyTrend).toEqual([]);
  });

  it("calculates jobsPerDay based on date range span", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // profiles
          builder.then = vi.fn((resolve) =>
            resolve({ data: { full_name: "Efficient Mech" }, error: null }),
          );
          break;
        case 2: // work_orders
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { id: "wo-1", created_at: "2026-03-01T10:00:00Z" },
                { id: "wo-2", created_at: "2026-03-02T10:00:00Z" },
              ],
              error: null,
            }),
          );
          break;
        case 3: // services
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [
                { final_price: 500, work_order_id: "wo-1" },
                { final_price: 500, work_order_id: "wo-2" },
              ],
              error: null,
            }),
          );
          break;
        default: // parts
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    // Mar 1 → Mar 5 = 4 days span → 2 orders / 4 days = 0.5
    const result = await getMechanicPerformanceTrend(
      mockClient as any,
      "org-1",
      "mech-4",
      "weekly",
      "2026-03-01",
      "2026-03-05",
    );

    expect(result.completedOrders).toBe(2);
    expect(result.jobsPerDay).toBe(0.5); // 2 orders / 4 days
    expect(result.avgJobValue).toBe(500); // 1000/2
  });

  it("applies branch filter when branchId is provided", async () => {
    let callIndex = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callIndex++;
      const builder = makeBuilder();
      switch (callIndex) {
        case 1: // profiles
          builder.then = vi.fn((resolve) =>
            resolve({ data: { full_name: "Branch Mech" }, error: null }),
          );
          break;
        case 2: // work_orders — with branch filter applied via withBranchFilter
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [{ id: "wo-1", created_at: "2026-04-10T10:00:00Z" }],
              error: null,
            }),
          );
          break;
        case 3: // services
          builder.then = vi.fn((resolve) =>
            resolve({
              data: [{ final_price: 300, work_order_id: "wo-1" }],
              error: null,
            }),
          );
          break;
        default: // parts
          builder.then = vi.fn((resolve) => resolve({ data: [], error: null }));
      }
      return builder;
    });

    const result = await getMechanicPerformanceTrend(
      mockClient as any,
      "org-1",
      "mech-5",
      "weekly",
      "2026-04-01",
      "2026-04-30",
      "branch-1",
    );

    expect(result.completedOrders).toBe(1);
    expect(result.revenue).toBe(300);

    // Verify the work_orders table was queried (withBranchFilter chains .eq on the same builder)
    expect(mockClient.from).toHaveBeenCalledWith("work_orders");
  });
});
