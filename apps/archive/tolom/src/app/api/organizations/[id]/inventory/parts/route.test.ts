import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPartsCatalogMock = vi.fn();
const createPartMock = vi.fn();
const updatePartMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getPartsCatalog: getPartsCatalogMock,
  createPart: createPartMock,
  updatePart: updatePartMock,
}));

const { GET, POST, PATCH } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const url = `http://localhost/api/organizations/${orgId}/inventory/parts`;

    it("returns the parts catalog", async () => {
      getPartsCatalogMock.mockResolvedValue([
        { id: "part-1", name: "Oil Filter" },
      ]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getPartsCatalogMock).toHaveBeenCalledWith(supabase, orgId);
      expect(body.data).toEqual([{ id: "part-1", name: "Oil Filter" }]);
    });

    it("handles service error", async () => {
      getPartsCatalogMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/inventory/parts`;

    it("creates a part", async () => {
      createPartMock.mockResolvedValue({ id: "part-1" });
      const body = { name: "Brake Pad", unit_price: 25000 };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(createPartMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "part-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      createPartMock.mockRejectedValue(new Error("Validation failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ name: "" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Validation failed");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    const url = `http://localhost/api/organizations/${orgId}/inventory/parts`;

    it("updates a part", async () => {
      updatePartMock.mockResolvedValue({ id: "part-1", name: "Updated" });
      const body = { name: "Premium Brake Pad" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?partId=part-1`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(updatePartMock).toHaveBeenCalledWith(
        supabase,
        "part-1",
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "part-1", name: "Updated" });
    });

    it("also matches part by id param as fallback", async () => {
      updatePartMock.mockResolvedValue({ id: "part-1" });
      const body = { name: "Updated" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?id=part-1`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ supabase, orgId, request, user });

      expect(updatePartMock).toHaveBeenCalledWith(
        supabase,
        "part-1",
        orgId,
        body,
        user.id,
      );
      expect(response.status).toBe(200);
    });

    it("returns validation error when partId is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION");
      expect(response.status).toBe(400);
      expect(updatePartMock).not.toHaveBeenCalled();
    });

    it("handles service error on update", async () => {
      updatePartMock.mockRejectedValue(new Error("Update failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?partId=part-1`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Update failed");
    });
  });
});
