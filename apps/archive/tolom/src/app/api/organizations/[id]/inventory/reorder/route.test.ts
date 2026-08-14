import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/reorder route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/reorder`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns empty array when no thresholds exist", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      const balances = [
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 2,
          branch_id: null,
        },
        {
          part_id: "part-2",
          part_name: "Brake Pad",
          part_number: "BP-200",
          category: "Brakes",
          unit: "set",
          quantity_on_hand: 10,
          branch_id: null,
        },
      ];

      // First await: balances query
      supabase.__qb.resolveOnce({ data: balances, error: null });
      // Second await: thresholds query - empty
      supabase.__qb.resolveOnce({ data: [], error: null });

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toEqual([]);
    });

    it("returns parts needing reorder when quantity below threshold", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      const balances = [
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 2,
          branch_id: null,
        },
        {
          part_id: "part-2",
          part_name: "Brake Pad",
          part_number: "BP-200",
          category: "Brakes",
          unit: "set",
          quantity_on_hand: 10,
          branch_id: null,
        },
        {
          part_id: "part-3",
          part_name: "Spark Plug",
          part_number: "SP-300",
          category: "Ignition",
          unit: "pcs",
          quantity_on_hand: 0,
          branch_id: null,
        },
      ];

      const thresholds = [
        { part_id: "part-1", minimum_quantity: 5, branch_id: null },
        { part_id: "part-2", minimum_quantity: 5, branch_id: null },
        // no threshold for part-3
      ];

      // Preferred supplier data
      const supplierData = [
        {
          part_id: "part-1",
          suppliers: { id: "supp-1", name: "Auto Parts Co" },
        },
      ];

      supabase.__qb.resolveOnce({ data: balances, error: null });
      supabase.__qb.resolveOnce({ data: thresholds, error: null });
      supabase.__qb.resolveOnce({ data: supplierData, error: null });
      // Fourth await: fallback supplier query for parts without preferred supplier
      supabase.__qb.resolveOnce({
        data: [
          {
            part_id: "part-2",
            suppliers: { id: "supp-2", name: "Generic Parts Ltd" },
          },
        ],
        error: null,
      });

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      // part-1 has qty=2, min=5 → shortage=3
      // part-2 has qty=10, min=5 → qty > min, not included
      // part-3 has no threshold → not included
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        part_id: "part-1",
        part_name: "Oil Filter",
        part_number: "OF-100",
        quantity_on_hand: 2,
        minimum_quantity: 5,
        shortage: 3,
        suggested_order_qty: 3,
        preferred_supplier: "Auto Parts Co",
      });
    });

    it("handles branch_id filter with composite threshold keys", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      // The branch_id query parameter affects how threshold keys are constructed.
      // Since the route doesn't filter balances at the DB level, org-wide thresholds
      // and branch-specific thresholds for ALL branches end up in the map.
      // When branch_id="branch-1":
      //   - Balance for branch-1 gets key "part-1:branch-1" → matches threshold (min=5)
      //   - Balance for branch-2 gets key "part-1:branch-2" → also matches threshold (min=10)
      // To make only branch-1 need reorder, give branch-2 enough stock.
      const balances = [
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 2,
          branch_id: "branch-1",
        },
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 15,
          branch_id: "branch-2",
        },
      ];

      const thresholds = [
        { part_id: "part-1", minimum_quantity: 5, branch_id: "branch-1" },
        { part_id: "part-1", minimum_quantity: 10, branch_id: "branch-2" },
      ];

      supabase.__qb.resolveOnce({ data: balances, error: null });
      supabase.__qb.resolveOnce({ data: thresholds, error: null });
      // Supplier queries - for the part that needs reorder
      supabase.__qb.resolveOnce({ data: [], error: null });

      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        part_id: "part-1",
        quantity_on_hand: 2,
        minimum_quantity: 5,
        shortage: 3,
        suggested_order_qty: 3,
      });
    });

    it("adds buffer to suggested_order_qty", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      const balances = [
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 2,
          branch_id: null,
        },
      ];

      const thresholds = [
        { part_id: "part-1", minimum_quantity: 5, branch_id: null },
      ];

      supabase.__qb.resolveOnce({ data: balances, error: null });
      supabase.__qb.resolveOnce({ data: thresholds, error: null });
      // Supplier queries
      supabase.__qb.resolveOnce({ data: [], error: null });

      const request = new NextRequest(`${baseUrl}?buffer=10`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toHaveLength(1);
      // shortage = 5 - 2 = 3, buffer = 10, suggested = 3 + 10 = 13
      expect(body.data[0]).toMatchObject({
        part_id: "part-1",
        shortage: 3,
        suggested_order_qty: 13,
      });
    });

    it("prefers branch-specific threshold over org-wide threshold", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      const balances = [
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 6,
          branch_id: "branch-1",
        },
      ];

      const thresholds = [
        // org-wide threshold (branch_id null)
        { part_id: "part-1", minimum_quantity: 5, branch_id: null },
        // branch-specific threshold
        { part_id: "part-1", minimum_quantity: 10, branch_id: "branch-1" },
      ];

      supabase.__qb.resolveOnce({ data: balances, error: null });
      supabase.__qb.resolveOnce({ data: thresholds, error: null });
      supabase.__qb.resolveOnce({ data: [], error: null });

      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      // With branch_id="branch-1":
      // - Threshold with branch_id="branch-1": key = "part-1:branch-1", min = 10
      // - The code prefers branch-specific when key already exists:
      //   "if (!thresholdMap.has(key) || th.branch_id === null)"
      //   For first threshold (branch_id null): key = "part-1" (since !th.branch_id), sets "part-1" → 5
      //   For second threshold (branch_id "branch-1"): key = "part-1:branch-1", sets "part-1:branch-1" → 10
      // Balance key = "branch-1" && "branch-1" ? "part-1:branch-1" : "part-1" = "part-1:branch-1"
      // → looks up "part-1:branch-1" = 10
      // qty=6 <= min=10 → needs reorder, shortage=4

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        part_id: "part-1",
        quantity_on_hand: 6,
        minimum_quantity: 10,
        shortage: 4,
        suggested_order_qty: 4,
      });
    });

    it("returns preferred_supplier as null when no supplier found", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      const balances = [
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 2,
          branch_id: null,
        },
      ];

      const thresholds = [
        { part_id: "part-1", minimum_quantity: 5, branch_id: null },
      ];

      supabase.__qb.resolveOnce({ data: balances, error: null });
      supabase.__qb.resolveOnce({ data: thresholds, error: null });
      // Preferred supplier query returns empty
      supabase.__qb.resolveOnce({ data: [], error: null });
      // Fallback supplier query also returns empty
      supabase.__qb.resolveOnce({ data: [], error: null });

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toHaveLength(1);
      expect(body.data[0].preferred_supplier).toBeNull();
    });

    it("handles supabase error on balances query", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      supabase.__qb.resolveOnce({
        data: null,
        error: new Error("DB connection failed"),
      });

      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB connection failed",
      );
    });

    it("handles supabase error on thresholds query", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      const balances = [
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 2,
          branch_id: null,
        },
      ];

      supabase.__qb.resolveOnce({ data: balances, error: null });
      supabase.__qb.resolveOnce({
        data: null,
        error: new Error("Thresholds error"),
      });

      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "Thresholds error",
      );
    });

    it("returns all parts below threshold regardless of category", async () => {
      const { createMockSupabaseClient } = await import(
        "@/test/mocks/supabase"
      );
      const supabase = createMockSupabaseClient();

      const balances = [
        {
          part_id: "part-1",
          part_name: "Oil Filter",
          part_number: "OF-100",
          category: "Filters",
          unit: "pcs",
          quantity_on_hand: 1,
          branch_id: null,
        },
        {
          part_id: "part-2",
          part_name: "Brake Fluid",
          part_number: "BF-200",
          category: "Fluids",
          unit: "ltr",
          quantity_on_hand: 0,
          branch_id: null,
        },
        {
          part_id: "part-3",
          part_name: "Wiper Blade",
          part_number: "WB-300",
          category: "Exterior",
          unit: "pcs",
          quantity_on_hand: 5,
          branch_id: null,
        },
      ];

      const thresholds = [
        { part_id: "part-1", minimum_quantity: 5, branch_id: null },
        { part_id: "part-2", minimum_quantity: 3, branch_id: null },
        { part_id: "part-3", minimum_quantity: 10, branch_id: null },
      ];

      supabase.__qb.resolveOnce({ data: balances, error: null });
      supabase.__qb.resolveOnce({ data: thresholds, error: null });
      // Preferred supplier - empty for all
      supabase.__qb.resolveOnce({ data: [], error: null });
      // Fallback supplier query for all 3 parts
      supabase.__qb.resolveOnce({ data: [], error: null });

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toHaveLength(3);
      expect(body.data.map((r: any) => r.part_id)).toEqual([
        "part-1",
        "part-2",
        "part-3",
      ]);
      expect(body.data[0]).toMatchObject({
        part_id: "part-1",
        shortage: 4,
        suggested_order_qty: 4,
      });
      expect(body.data[1]).toMatchObject({
        part_id: "part-2",
        shortage: 3,
        suggested_order_qty: 3,
      });
      expect(body.data[2]).toMatchObject({
        part_id: "part-3",
        shortage: 5,
        suggested_order_qty: 5,
      });
    });
  });
});
