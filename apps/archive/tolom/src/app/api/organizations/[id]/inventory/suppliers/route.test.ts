import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getSuppliersMock = vi.fn();
const createSupplierMock = vi.fn();
const updateSupplierMock = vi.fn();
const deleteSupplierMock = vi.fn();

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
  getSuppliers: getSuppliersMock,
  createSupplier: createSupplierMock,
  updateSupplier: updateSupplierMock,
  deleteSupplier: deleteSupplierMock,
}));

const { GET, POST, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/suppliers route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/suppliers`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns suppliers on success", async () => {
      const suppliers = [
        { id: "s-1", name: "Auto Parts Co" },
        { id: "s-2", name: "Tire Wholesale" },
      ];
      getSuppliersMock.mockResolvedValue(suppliers);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getSuppliersMock).toHaveBeenCalledWith(supabase, orgId);
      expect(body.data).toEqual(suppliers);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getSuppliersMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("creates and returns a supplier", async () => {
      const body = { name: "New Supplier" };
      const createdSupplier = { id: "s-3", name: "New Supplier" };
      createSupplierMock.mockResolvedValue(createdSupplier);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        supabase,
        orgId,
        request,
        user,
      });
      const data = await response.json();

      expect(createSupplierMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual(createdSupplier);
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      createSupplierMock.mockRejectedValue(new Error("Create failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Fail" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Create failed");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("updates a supplier by supplierId", async () => {
      const updatedSupplier = { id: "s-1", name: "Updated Name" };
      updateSupplierMock.mockResolvedValue(updatedSupplier);
      const body = { name: "Updated Name" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?supplierId=s-1`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        request,
        user,
      });
      const data = await response.json();

      expect(updateSupplierMock).toHaveBeenCalledWith(
        supabase,
        "s-1",
        orgId,
        body,
      );
      expect(data.data).toEqual(updatedSupplier);
      expect(response.status).toBe(200);
    });

    it("falls back to id param when supplierId is missing", async () => {
      const updatedSupplier = { id: "s-2", name: "Fallback Name" };
      updateSupplierMock.mockResolvedValue(updatedSupplier);
      const body = { name: "Fallback Name" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?id=s-2`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        request,
        user,
      });
      const data = await response.json();

      expect(updateSupplierMock).toHaveBeenCalledWith(
        supabase,
        "s-2",
        orgId,
        body,
      );
      expect(data.data).toEqual(updatedSupplier);
      expect(response.status).toBe(200);
    });

    it("returns 400 when no supplierId is provided", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ name: "Orphan" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        request,
        user,
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION");
      expect(data.error.message).toBe("supplierId required");
      expect(response.status).toBe(400);
    });

    it("handles service error on update", async () => {
      updateSupplierMock.mockRejectedValue(new Error("Update failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?supplierId=s-1`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Boom" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("deletes a supplier by supplierId", async () => {
      deleteSupplierMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?supplierId=s-1`);
      const response = await (DELETE as any)({ supabase, orgId, request });
      const data = await response.json();

      expect(deleteSupplierMock).toHaveBeenCalledWith(supabase, "s-1", orgId);
      expect(data.data).toEqual({ success: true });
      expect(response.status).toBe(200);
    });

    it("falls back to id param when supplierId is missing", async () => {
      deleteSupplierMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?id=s-2`);
      const response = await (DELETE as any)({ supabase, orgId, request });
      const data = await response.json();

      expect(deleteSupplierMock).toHaveBeenCalledWith(supabase, "s-2", orgId);
      expect(data.data).toEqual({ success: true });
      expect(response.status).toBe(200);
    });

    it("returns 400 when no supplierId is provided", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (DELETE as any)({ supabase, orgId, request });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION");
      expect(data.error.message).toBe("supplierId required");
      expect(response.status).toBe(400);
    });

    it("handles service error on delete", async () => {
      deleteSupplierMock.mockRejectedValue(new Error("Delete failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?supplierId=s-1`);
      await expect(
        (DELETE as any)({ supabase, orgId, request }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
