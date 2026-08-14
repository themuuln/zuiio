/**
 * Tests for src/lib/agent-tools/index.ts and its sub-modules
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAllAgentTools,
  createInventoryTools,
  createSalesTools,
} from "../index";

// Mock server-only so it doesn't throw in test env
vi.mock("server-only", () => ({}));

// Mock @zuiio/capture — capture is used for error logging, should not throw
vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
}));

// ─── Mock Supabase builder ──────────────────────────────────────────────

type MockResult = { data: unknown; error: unknown };

interface MockBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: (
    onfulfilled: (value: MockResult) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
}

interface MockSupabaseContext {
  /** Supabase client mock — pass to tool factories */
  supabase: SupabaseClient<Record<string, never>>;
  /** Chainable builder — inspect method calls via vi.fn() */
  builder: MockBuilder;
}

/** Shared mutable result queue consumed by the mock builder's then. */
let mockResults: MockResult[] = [];

function createMockSupabase(): MockSupabaseContext {
  const builder: Partial<MockBuilder> = {};

  const chainMethods = [
    "select",
    "eq",
    "is",
    "not",
    "ilike",
    "order",
    "limit",
    "gte",
    "or",
    "filter",
    "single",
    "maybeSingle",
  ] as const satisfies readonly (keyof MockBuilder)[];

  for (const method of chainMethods) {
    builder[method] = vi.fn(() => builder);
  }

  // Make the builder thenable — each await shifts the next result off the queue
  // biome-ignore lint/suspicious/noThenProperty: mock needs to be await/chainable
  builder.then = (
    onfulfilled: (value: MockResult) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => {
    const result = mockResults.shift() ?? { data: null, error: null };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  };

  // Structurally matches SupabaseClient's from/rpc for the tool factories
  const supabase = {
    from: vi.fn(() => builder),
    rpc: vi.fn(() => builder),
    auth: { getSession: vi.fn(), getUser: vi.fn() },
    rest: {},
  } as unknown as SupabaseClient<Record<string, never>>;

  return { supabase, builder: builder as MockBuilder };
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe("createAllAgentTools", () => {
  const orgId = "org-b9e3";

  it("returns 5 tools from both factories", () => {
    const { supabase } = createMockSupabase();
    const tools = createAllAgentTools(supabase, orgId);
    expect(tools).toHaveLength(5);
  });

  it("includes inventory tools (getInventory, getLowStockItems)", () => {
    const { supabase } = createMockSupabase();
    const tools = createAllAgentTools(supabase, orgId);
    const names = tools.map((t) => t.name);
    expect(names).toContain("getInventory");
    expect(names).toContain("getLowStockItems");
  });

  it("includes sales tools (getSalesSummary, getPendingSales, getTodaySales)", () => {
    const { supabase } = createMockSupabase();
    const tools = createAllAgentTools(supabase, orgId);
    const names = tools.map((t) => t.name);
    expect(names).toContain("getSalesSummary");
    expect(names).toContain("getPendingSales");
    expect(names).toContain("getTodaySales");
  });

  it("each tool has name, description, parameters, and execute function", () => {
    const { supabase } = createMockSupabase();
    const tools = createAllAgentTools(supabase, orgId);

    for (const tool of tools) {
      expect(typeof tool.name).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(0);
      expect(Array.isArray(tool.parameters)).toBe(true);
      expect(typeof tool.execute).toBe("function");
    }
  });
});

describe("createInventoryTools", () => {
  let ctx: MockSupabaseContext;
  const orgId = "org-b9e3";

  beforeEach(() => {
    mockResults = [];
    ctx = createMockSupabase();
  });

  describe("getInventory", () => {
    it("queries the products table with correct orgId", async () => {
      mockResults = [
        {
          data: [
            {
              name: "Бүтээгдэхүүн",
              sku: "SKU-1",
              current_stock: 10,
              min_stock: 5,
              sale_price: 1000,
              cost_price: 700,
              unit: "ш",
            },
          ],
          error: null,
        },
      ];

      const tools = createInventoryTools(ctx.supabase, orgId);
      const result = await tools[0].execute({});

      expect(ctx.supabase.from).toHaveBeenCalledWith("products");
      expect(ctx.builder.select).toHaveBeenCalledWith(
        "name, sku, current_stock, min_stock, sale_price, cost_price, unit",
      );
      expect(ctx.builder.eq).toHaveBeenCalledWith("organization_id", orgId);
      expect(ctx.builder.is).toHaveBeenCalledWith("deleted_at", null);

      expect(result).toEqual({
        items: [
          {
            name: "Бүтээгдэхүүн",
            sku: "SKU-1",
            currentStock: 10,
            minStock: 5,
            salePrice: 1000,
            costPrice: 700,
            unit: "ш",
          },
        ],
        total: 1,
      });
    });

    it("handles empty query string — applies no ilike filter", async () => {
      mockResults = [
        {
          data: [
            {
              name: "A",
              sku: null,
              current_stock: 5,
              min_stock: 2,
              sale_price: 500,
              cost_price: 300,
              unit: null,
            },
          ],
          error: null,
        },
      ];

      const tools = createInventoryTools(ctx.supabase, orgId);
      await tools[0].execute({ query: "" });

      expect(ctx.builder.ilike).not.toHaveBeenCalled();
    });

    it("applies ilike filter when query is provided", async () => {
      mockResults = [
        {
          data: [
            {
              name: "Test Product",
              sku: "TST",
              current_stock: 3,
              min_stock: 1,
              sale_price: 2000,
              cost_price: 1500,
              unit: "ш",
            },
          ],
          error: null,
        },
      ];

      const tools = createInventoryTools(ctx.supabase, orgId);
      await tools[0].execute({ query: "Test" });

      expect(ctx.builder.ilike).toHaveBeenCalledWith("name", "%Test%");
    });

    it("uses default limit=5 when limit is not provided", async () => {
      mockResults = [{ data: [], error: null }];
      const tools = createInventoryTools(ctx.supabase, orgId);
      await tools[0].execute({});
      expect(ctx.builder.limit).toHaveBeenCalledWith(5);
    });
  });

  describe("getLowStockItems", () => {
    it("queries products where current_stock <= min_stock", async () => {
      const dbRows = [
        {
          name: "Low Item",
          current_stock: 2,
          min_stock: 5,
          sku: "LOW-1",
          unit: "ш",
        },
        {
          name: "OK Item",
          current_stock: 10,
          min_stock: 5,
          sku: "OK-1",
          unit: "ш",
        },
      ];
      mockResults = [{ data: dbRows, error: null }];

      const tools = createInventoryTools(ctx.supabase, orgId);
      const result = await tools[1].execute({});

      expect(ctx.supabase.from).toHaveBeenCalledWith("products");
      expect(ctx.builder.eq).toHaveBeenCalledWith("organization_id", orgId);
      expect(ctx.builder.is).toHaveBeenCalledWith("deleted_at", null);
      expect(ctx.builder.not).toHaveBeenCalledWith("current_stock", "is", null);
      expect(ctx.builder.not).toHaveBeenCalledWith("min_stock", "is", null);

      // JS filter should exclude OK Item (10 > 5)
      expect(result).toEqual({
        items: [
          {
            name: "Low Item",
            currentStock: 2,
            minStock: 5,
            sku: "LOW-1",
            unit: "ш",
          },
        ],
        count: 1,
      });
    });

    it("returns empty items when no low-stock products", async () => {
      mockResults = [{ data: [], error: null }];
      const tools = createInventoryTools(ctx.supabase, orgId);
      const result = await tools[1].execute({});
      expect(result).toEqual({ items: [], count: 0 });
    });
  });
});

describe("createSalesTools", () => {
  let ctx: MockSupabaseContext;
  const orgId = "org-b9e3";

  beforeEach(() => {
    mockResults = [];
    ctx = createMockSupabase();
  });

  describe("getSalesSummary", () => {
    it("queries sales table with correct orgId and date range", async () => {
      // First query: sales aggregation, second query: sale_items
      mockResults = [
        { data: [{ total_amount: "1000", paid_amount: "800" }], error: null },
        { data: [], error: null },
      ];

      const tools = createSalesTools(ctx.supabase, orgId);
      expect(tools[0].name).toBe("getSalesSummary");

      await tools[0].execute({ days: 7 });

      expect(ctx.supabase.from).toHaveBeenNthCalledWith(1, "sales");
      expect(ctx.builder.select).toHaveBeenCalledWith(
        "total_amount, paid_amount",
      );
      expect(ctx.builder.eq).toHaveBeenCalledWith("organization_id", orgId);
      expect(ctx.builder.gte).toHaveBeenCalledWith(
        "sale_date",
        expect.any(String),
      );
      expect(ctx.supabase.from).toHaveBeenNthCalledWith(2, "sale_items");
    });

    it("uses default 7 days when args have no days field", async () => {
      mockResults = [
        { data: [{ total_amount: "500", paid_amount: "500" }], error: null },
        { data: [], error: null },
      ];

      const tools = createSalesTools(ctx.supabase, orgId);
      const result = (await tools[0].execute({})) as Record<string, unknown>;

      expect(result.period).toContain("7");
    });

    it("computes totals from sales rows", async () => {
      mockResults = [
        {
          data: [
            { total_amount: "10000", paid_amount: "8000" },
            { total_amount: "5000", paid_amount: "4000" },
          ],
          error: null,
        },
        { data: [], error: null },
      ];

      const tools = createSalesTools(ctx.supabase, orgId);
      const result = (await tools[0].execute({ days: 30 })) as Record<
        string,
        unknown
      >;

      expect(result.totalAmount).toBe(15000);
      expect(result.totalPaid).toBe(12000);
      expect(result.pendingAmount).toBe(3000);
      expect(result.saleCount).toBe(2);
    });
  });

  describe("getPendingSales", () => {
    it("queries sales with pending payment condition", async () => {
      mockResults = [
        {
          data: [
            {
              id: "s1",
              sale_date: "2026-07-20",
              total_amount: "5000",
              paid_amount: "2000",
              status: "active",
            },
            {
              id: "s2",
              sale_date: "2026-07-21",
              total_amount: "3000",
              paid_amount: null,
              status: "active",
            },
          ],
          error: null,
        },
      ];

      const tools = createSalesTools(ctx.supabase, orgId);
      expect(tools[1].name).toBe("getPendingSales");

      const result = (await tools[1].execute({})) as Record<string, unknown>;

      expect(ctx.supabase.from).toHaveBeenCalledWith("sales");
      expect(ctx.builder.eq).toHaveBeenCalledWith("organization_id", orgId);
      expect(ctx.builder.or).toHaveBeenCalledWith(
        "paid_amount.is.null,paid_amount.lt.total_amount",
      );
      expect(ctx.builder.limit).toHaveBeenCalledWith(10);

      expect(result.items).toHaveLength(2);
      const totalPendingAmount = result.totalPendingAmount as number;
      expect(totalPendingAmount).toBe(6000);
      expect(result.count).toBe(2);
    });
  });

  describe("getTodaySales", () => {
    it("queries sales for today and returns aggregated result", async () => {
      mockResults = [
        {
          data: [{ total_amount: "12000", paid_amount: "10000" }],
          error: null,
        },
        { data: [], error: null },
      ];

      const tools = createSalesTools(ctx.supabase, orgId);
      expect(tools[2].name).toBe("getTodaySales");

      const result = (await tools[2].execute({})) as Record<string, unknown>;

      expect(ctx.supabase.from).toHaveBeenCalledWith("sales");
      expect(ctx.builder.eq).toHaveBeenCalledWith("organization_id", orgId);
      expect(ctx.builder.gte).toHaveBeenCalledWith(
        "sale_date",
        expect.any(String),
      );

      expect(result.totalAmount).toBe(12000);
      expect(result.totalPaid).toBe(10000);
      expect(result.saleCount).toBe(1);
      expect(result).toHaveProperty("date");
      expect(result).toHaveProperty("topProducts");
    });
  });
});
