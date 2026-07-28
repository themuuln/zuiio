import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getPartMock = vi.fn();
const updatePartMock = vi.fn();
const deletePartMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getPart: getPartMock,
  updatePart: updatePartMock,
  deletePart: deletePartMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts/[partId] route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const partId = "part-1";
  const params = { partId };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns a part by id", async () => {
      const part = { id: partId, name: "Oil Filter", price: 15000 };
      getPartMock.mockResolvedValue(part);

      const supabase = {};
      const response = await (GET as any)({ supabase, orgId, params });
      const body = await response.json();

      expect(getPartMock).toHaveBeenCalledWith(supabase, partId, orgId);
      expect(body.data).toEqual(part);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getPartMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (GET as any)({ supabase: {}, orgId, params }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("updates a part", async () => {
      const body = { name: "Updated Filter", price: 18000 };
      const updatedPart = { id: partId, ...body };
      updatePartMock.mockResolvedValue(updatedPart);

      const supabase = {};
      const request = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      const response = await (PATCH as any)({
        supabase,
        orgId,
        params,
        request,
        user,
      });
      const responseBody = await response.json();

      expect(updatePartMock).toHaveBeenCalledWith(
        supabase,
        partId,
        orgId,
        body,
        user.id,
      );
      expect(responseBody.data).toEqual(updatedPart);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      updatePartMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "test" }),
      });

      await expect(
        (PATCH as any)({ supabase: {}, orgId, params, request, user }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("deletes a part", async () => {
      deletePartMock.mockResolvedValue(undefined);

      const supabase = {};
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params,
        user,
      });
      const body = await response.json();

      expect(deletePartMock).toHaveBeenCalledWith(
        supabase,
        partId,
        orgId,
        user.id,
      );
      expect(body.data).toBeNull();
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      deletePartMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (DELETE as any)({ supabase: {}, orgId, params, user }),
      ).rejects.toThrow("DB error");
    });
  });
});
