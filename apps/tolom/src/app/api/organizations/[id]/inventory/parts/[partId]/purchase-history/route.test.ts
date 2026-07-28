import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts/[partId]/purchase-history route", () => {
  const orgId = "org-1";
  const partId = "part-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const mockHistory = [
      {
        id: "poi-1",
        quantity_ordered: 10,
        quantity_received: 10,
        unit_cost: 25.5,
        purchase_order: {
          id: "po-1",
          created_at: "2026-01-15T10:00:00Z",
          status: "received",
          supplier: { id: "supp-1", name: "ACME Corp" },
        },
      },
      {
        id: "poi-2",
        quantity_ordered: 5,
        quantity_received: 3,
        unit_cost: 26.0,
        purchase_order: {
          id: "po-2",
          created_at: "2026-02-20T14:30:00Z",
          status: "partial",
          supplier: { id: "supp-2", name: "Parts R Us" },
        },
      },
    ];

    it("returns purchase history for the part", async () => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
      };
      const mockFrom = vi.fn(() => chain);
      const supabase = { from: mockFrom };

      const response = await (GET as any)({
        supabase,
        orgId,
        params: { partId },
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockHistory);
      expect(mockFrom).toHaveBeenCalledWith("purchase_order_items");
      expect(chain.select).toHaveBeenCalledWith(
        "id, quantity_ordered, quantity_received, unit_cost, purchase_order:purchase_orders!inner(id, created_at, status, supplier:suppliers!inner(id, name))",
      );
      expect(chain.eq).toHaveBeenCalledWith("part_id", partId);
      expect(chain.eq).toHaveBeenCalledWith("organization_id", orgId);
      expect(chain.order).toHaveBeenCalledWith("created_at", {
        referencedTable: "purchase_orders",
        ascending: false,
      });
    });

    it("returns empty array when no purchase history exists", async () => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      const mockFrom = vi.fn(() => chain);
      const supabase = { from: mockFrom };

      const response = await (GET as any)({
        supabase,
        orgId,
        params: { partId },
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it("throws on database error", async () => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: "DB error" } }),
      };
      const mockFrom = vi.fn(() => chain);
      const supabase = { from: mockFrom };

      await expect(
        (GET as any)({ supabase, orgId, params: { partId } }),
      ).rejects.toThrow("DB error");
    });
  });
});
