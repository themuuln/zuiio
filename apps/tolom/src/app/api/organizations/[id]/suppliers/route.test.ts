import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getSuppliersMock = vi.fn();
const createSupplierMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getSuppliers: getSuppliersMock,
  createSupplier: createSupplierMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/suppliers route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/suppliers`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns suppliers on success", async () => {
      const suppliers = {
        data: [{ id: "sup-1", name: "Auto Parts Co." }],
        count: 1,
      };
      getSuppliersMock.mockResolvedValue(suppliers);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({ supabase, orgId });
      const body = await response.json();

      expect(getSuppliersMock).toHaveBeenCalledWith(supabase, orgId);
      expect(body.data).toEqual(suppliers);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getSuppliersMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      await expect((GET as any)({ supabase, orgId })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("creates a supplier", async () => {
      const supplier = { id: "sup-1", name: "Auto Parts Co." };
      createSupplierMock.mockResolvedValue(supplier);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Auto Parts Co." }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const body = await response.json();

      expect(createSupplierMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        { name: "Auto Parts Co." },
        user.id,
      );
      expect(body.data).toEqual(supplier);
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      createSupplierMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Auto Parts Co." }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("DB error");
    });
  });
});
