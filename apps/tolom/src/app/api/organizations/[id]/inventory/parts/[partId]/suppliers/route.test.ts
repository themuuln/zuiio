import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPartSuppliersMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/supplier-service", () => ({
  getPartSuppliers: getPartSuppliersMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts/[partId]/suppliers route", () => {
  const orgId = "org-1";
  const partId = "part-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns part suppliers on success", async () => {
      const suppliers = [
        {
          id: "sp-1",
          supplier_id: "supplier-1",
          part_id: partId,
          supplier_part_number: "SP-001",
          unit_cost: 15000,
          is_preferred: true,
          supplier: {
            id: "supplier-1",
            name: "Auto Parts Co",
            phone: "99110001",
            email: "contact@autoparts.mn",
          },
        },
      ];
      getPartSuppliersMock.mockResolvedValue(suppliers);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { partId },
      });

      const body = await response.json();

      expect(getPartSuppliersMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        partId,
      );
      expect(body.data).toEqual(suppliers);
      expect(response.status).toBe(200);
    });

    it("returns empty list when no suppliers", async () => {
      getPartSuppliersMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { partId },
      });

      const body = await response.json();
      expect(body.data).toEqual([]);
    });
  });
});
