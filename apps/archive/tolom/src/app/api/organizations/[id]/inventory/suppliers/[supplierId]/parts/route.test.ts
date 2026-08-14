import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getSupplierPartsMock = vi.fn();
const addSupplierPartMock = vi.fn();
const removeSupplierPartMock = vi.fn();

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

vi.mock("@/lib/services/supplier-service", () => ({
  getSupplierParts: getSupplierPartsMock,
  addSupplierPart: addSupplierPartMock,
  removeSupplierPart: removeSupplierPartMock,
}));

const { GET, POST, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/suppliers/[supplierId]/parts route", () => {
  const orgId = "org-1";
  const supplierId = "supplier-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/suppliers/${supplierId}/parts`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns supplier parts on success", async () => {
      const parts = [
        {
          id: "sp-1",
          supplier_id: supplierId,
          part_id: "part-1",
          supplier_part_number: "SP-001",
          unit_cost: 15000,
          is_preferred: true,
          part: { id: "part-1", name: "Oil Filter", part_number: "OF-101" },
        },
      ];
      getSupplierPartsMock.mockResolvedValue(parts);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({
        request,
        supabase,
        orgId,
        params: { supplierId },
      });

      const body = await response.json();

      expect(getSupplierPartsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        supplierId,
      );
      expect(body.data).toEqual(parts);
      expect(response.status).toBe(200);
    });

    it("returns empty list when no parts", async () => {
      getSupplierPartsMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({
        request,
        supabase,
        orgId,
        params: { supplierId },
      });

      const body = await response.json();
      expect(body.data).toEqual([]);
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("creates a supplier-part mapping", async () => {
      const newPart = {
        id: "sp-new",
        supplier_id: supplierId,
        part_id: "part-1",
        supplier_part_number: null,
        unit_cost: null,
        is_preferred: false,
        part: { id: "part-1", name: "Oil Filter" },
      };
      addSupplierPartMock.mockResolvedValue(newPart);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({
          part_id: "part-1",
          supplier_part_number: null,
          unit_cost: null,
        }),
      });

      const response = await (POST as any)({
        request,
        supabase,
        orgId,
        user,
        params: { supplierId },
      });

      const body = await response.json();
      expect(addSupplierPartMock).toHaveBeenCalled();
      expect(body.data).toEqual(newPart);
      expect(response.status).toBe(201);
    });

    it("returns 400 when part_id is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await (POST as any)({
        request,
        supabase,
        orgId,
        user,
        params: { supplierId },
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("removes a supplier-part mapping", async () => {
      removeSupplierPartMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?id=sp-1`, {
        method: "DELETE",
      });

      const response = await (DELETE as any)({
        request,
        supabase,
        orgId,
      });

      expect(removeSupplierPartMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "sp-1",
      );
      expect(response.status).toBe(200);
    });

    it("returns 400 when id is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, { method: "DELETE" });

      const response = await (DELETE as any)({
        request,
        supabase,
        orgId,
      });

      expect(response.status).toBe(400);
    });
  });
});
