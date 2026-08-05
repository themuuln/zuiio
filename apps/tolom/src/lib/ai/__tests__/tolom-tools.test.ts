/**
 * Tests for src/lib/ai/tolom-tools.ts — Tolom-specific agent tools
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTolomTools } from "../tolom-tools";

// ─── Mocks ───────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("@zuiio/capture", () => ({
  capture: vi.fn(),
}));

// ─── Mock builder ────────────────────────────────────────────

type MockResult = { data: unknown; error: unknown };

interface MockBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: (
    onfulfilled: (value: MockResult) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
}

let mockResults: MockResult[] = [];

function createMockSupabase(
  results?: MockResult[],
): SupabaseClient & { _builder: MockBuilder } {
  if (results) {
    mockResults = results;
  }

  const builder: MockBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    then: vi.fn((onfulfilled) =>
      Promise.resolve(
        onfulfilled(mockResults.shift() ?? { data: null, error: null }),
      ),
    ),
  };

  const supabase = {
    from: vi.fn(() => builder),
  } as unknown as SupabaseClient & { _builder: MockBuilder };

  supabase._builder = builder;
  return supabase;
}

// ─── Tests ───────────────────────────────────────────────────

describe("createTolomTools", () => {
  beforeEach(() => {
    mockResults = [];
  });

  it("returns 5 tools", () => {
    const supabase = createMockSupabase();
    const tools = createTolomTools(supabase, "org-1");

    expect(tools).toHaveLength(5);
    expect(tools.map((t) => t.name)).toEqual([
      "getWorkOrders",
      "getPart",
      "getCustomer",
      "getInventoryBalance",
      "getTodayAppointments",
    ]);
  });

  describe("getWorkOrders", () => {
    it("returns work orders without status filter", async () => {
      const mockData = [
        {
          id: "wo-1",
          status: "In Progress",
          complaint: "Engine noise",
          created_at: "2026-07-30T10:00:00Z",
          customers: { full_name: "John", phone: "9911" },
          vehicles: {
            plate_number: "1234УНА",
            make: "Toyota",
            model: "Camry",
          },
        },
      ];

      const supabase = createMockSupabase([{ data: mockData, error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      const result = await tools[0].execute({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("In Progress");
      expect(result.items[0].customerName).toBe("John");
      expect(result.items[0].vehiclePlate).toBe("1234УНА");
      expect(result.total).toBe(1);
    });

    it("filters by status", async () => {
      const mockData: unknown[] = [];

      const supabase = createMockSupabase([{ data: mockData, error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      await tools[0].execute({ status: "Completed" });

      expect(supabase._builder.eq).toHaveBeenCalledWith("status", "Completed");
    });

    it("handles null customer and vehicle", async () => {
      const mockData = [
        {
          id: "wo-2",
          status: "New",
          complaint: null,
          created_at: "2026-07-29T10:00:00Z",
          customers: { full_name: null, phone: null },
          vehicles: {
            plate_number: null,
            make: null,
            model: null,
          },
        },
      ];

      const supabase = createMockSupabase([{ data: mockData, error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      const result = await tools[0].execute({});

      expect(result.items[0].customerName).toBe("Тодорхойгүй");
      expect(result.items[0].vehiclePlate).toBe("Тодорхойгүй");
    });

    it("bounds work-order windows and ignores unsupported statuses", async () => {
      const supabase = createMockSupabase([{ data: [], error: null }]);
      const tools = createTolomTools(supabase, "org-1");

      await tools[0].execute({
        days: Number.MAX_SAFE_INTEGER,
        limit: Number.MAX_SAFE_INTEGER,
        status: "drop table work_orders",
      });

      expect(supabase._builder.limit).toHaveBeenCalledWith(50);
      expect(supabase._builder.eq).not.toHaveBeenCalledWith(
        "status",
        expect.anything(),
      );
    });

    it("quotes and truncates part search input before building filters", async () => {
      const supabase = createMockSupabase([{ data: [], error: null }]);
      const tools = createTolomTools(supabase, "org-1");

      await tools[1].execute({
        query: `${"a".repeat(150)}"),drop`,
        limit: 500,
      });

      expect(supabase._builder.limit).toHaveBeenCalledWith(50);
      const filter = supabase._builder.or.mock.calls[0][0] as string;
      expect(filter).not.toContain('"),drop');
      expect(filter).toMatch(/^name\.ilike\."%a{100}/);
    });

    it("throws on DB error", async () => {
      const supabase = createMockSupabase([
        { data: null, error: new Error("DB error") },
      ]);
      const tools = createTolomTools(supabase, "org-1");

      await expect(tools[0].execute({})).rejects.toThrow(
        "Захиалгын хайлт амжилтгүй",
      );
    });
  });

  describe("getPart", () => {
    it("searches parts by name", async () => {
      const mockData = [
        {
          id: "part-1",
          name: "Engine Oil 5W-30",
          part_number: "EO-5W30",
          barcode: null,
          category: "Oil",
          purchase_price: 32000,
          default_price: 45000,
          unit: "pc",
        },
      ];

      const supabase = createMockSupabase([{ data: mockData, error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      const result = await tools[1].execute({ query: "Engine Oil" });

      expect(result.items[0].name).toBe("Engine Oil 5W-30");
      expect(result.items[0].defaultPrice).toBe(45000);
      expect(supabase._builder.or).toHaveBeenCalled();
    });

    it("handles empty results", async () => {
      const supabase = createMockSupabase([{ data: [], error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      const result = await tools[1].execute({});

      expect(result.items).toHaveLength(0);
    });
  });

  describe("getCustomer", () => {
    it("searches customers by name or phone", async () => {
      const mockData = [
        {
          id: "cust-1",
          full_name: "Бат",
          phone: "99112233",
          email: "bat@example.com",
          notes: "Regular customer",
        },
      ];

      const supabase = createMockSupabase([{ data: mockData, error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      const result = await tools[2].execute({ query: "Бат" });

      expect(result.items[0].name).toBe("Бат");
      expect(result.items[0].phone).toBe("99112233");
    });
  });

  describe("getInventoryBalance", () => {
    it("returns inventory balance for a part", async () => {
      const mockData = [
        {
          part_id: "part-1",
          part_name: "Brake Pad",
          part_number: "BP-001",
          quantity_on_hand: 5,
          default_price: 85000,
          unit: "set",
        },
      ];

      const supabase = createMockSupabase([{ data: mockData, error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      const result = await tools[3].execute({ query: "Brake" });

      expect(result.items[0].partName).toBe("Brake Pad");
      expect(result.items[0].quantityOnHand).toBe(5);
    });
  });

  describe("getTodayAppointments", () => {
    it("returns today appointments", async () => {
      const mockData = [
        {
          id: "apt-1",
          title: "Oil Change",
          status: "scheduled",
          scheduled_at: "2026-07-31T10:00:00Z",
          end_at: "2026-07-31T11:00:00Z",
          customers: { full_name: "Saraa", phone: "9933" },
          vehicles: {
            plate_number: "9012УНА",
            make: "Lexus",
            model: "RX350",
          },
        },
      ];

      const supabase = createMockSupabase([{ data: mockData, error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      const result = await tools[4].execute({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Oil Change");
      expect(result.items[0].customerName).toBe("Saraa");
    });

    it("filters by status", async () => {
      const mockData: unknown[] = [];

      const supabase = createMockSupabase([{ data: mockData, error: null }]);
      const tools = createTolomTools(supabase, "org-1");
      await tools[4].execute({ status: "completed" });

      expect(supabase._builder.eq).toHaveBeenCalledWith("status", "completed");
    });
  });
});
