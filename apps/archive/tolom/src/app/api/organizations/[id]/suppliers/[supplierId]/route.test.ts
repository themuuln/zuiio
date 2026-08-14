import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getSupplierMock = vi.fn();
const updateSupplierMock = vi.fn();
const deleteSupplierMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  noContent: vi.fn(() => new Response(null, { status: 204 })),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getSupplier: getSupplierMock,
  updateSupplier: updateSupplierMock,
  deleteSupplier: deleteSupplierMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/suppliers/[supplierId] route", () => {
  const orgId = "org-1";
  const supplierId = "sup-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/suppliers/${supplierId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns a supplier by id", async () => {
      const supplier = { id: supplierId, name: "Auto Parts Co." };
      getSupplierMock.mockResolvedValue(supplier);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { supplierId },
      });
      const body = await response.json();

      expect(getSupplierMock).toHaveBeenCalledWith(supabase, supplierId, orgId);
      expect(body.data).toEqual(supplier);
    });

    it("handles service error", async () => {
      getSupplierMock.mockRejectedValue(new Error("Not found"));

      const supabase = createMockSupabaseClient();
      await expect(
        (GET as any)({ supabase, orgId, params: { supplierId } }),
      ).rejects.toThrow("Not found");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("updates a supplier", async () => {
      const updated = { id: supplierId, name: "Updated Parts Co." };
      updateSupplierMock.mockResolvedValue(updated);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated Parts Co." }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        params: { supplierId },
        request,
      });
      const body = await response.json();

      expect(updateSupplierMock).toHaveBeenCalledWith(
        supabase,
        supplierId,
        orgId,
        { name: "Updated Parts Co." },
      );
      expect(body.data).toEqual(updated);
    });

    it("handles service error on update", async () => {
      updateSupplierMock.mockRejectedValue(new Error("Update failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ supabase, orgId, params: { supplierId }, request }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("deletes a supplier", async () => {
      deleteSupplierMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params: { supplierId },
      });

      expect(deleteSupplierMock).toHaveBeenCalledWith(
        supabase,
        supplierId,
        orgId,
      );
      expect(response.status).toBe(204);
    });

    it("handles service error on delete", async () => {
      deleteSupplierMock.mockRejectedValue(new Error("Delete failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (DELETE as any)({ supabase, orgId, params: { supplierId } }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
