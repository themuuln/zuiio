import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const updateInspectionItemMock = vi.fn();
const removeInspectionItemMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/dvi-service", () => ({
  updateInspectionItem: updateInspectionItemMock,
  removeInspectionItem: removeInspectionItemMock,
}));

const { PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/dv-inspections/[inspectionId]/items/[itemId]", () => {
  const orgId = "org-1";
  const inspectionId = "insp-1";
  const itemId = "item-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseUrl = `http://localhost/api/organizations/${orgId}/dv-inspections/${inspectionId}/items/${itemId}`;

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("updates an inspection item", async () => {
      updateInspectionItemMock.mockResolvedValue({
        id: itemId,
        category: "brakes",
        item_name: "Front brake pads (updated)",
        condition: "good",
      });

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ item_name: "Front brake pads (updated)", condition: "good" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId, itemId },
      });
      const data = await response.json();

      expect(updateInspectionItemMock).toHaveBeenCalledWith(
        supabase,
        inspectionId,
        itemId,
        orgId,
        user.id,
        expect.objectContaining({
          item_name: "Front brake pads (updated)",
        }),
      );
      expect(data.data.id).toBe(itemId);
      expect(response.status).toBe(200);
    });

    it("returns 400 when no fields provided", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId, itemId },
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 when inspectionId is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ item_name: "Updated" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        user,
        supabase,
        params: { itemId },
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 when itemId is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ item_name: "Updated" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId },
      });
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      updateInspectionItemMock.mockRejectedValue(new Error("DB error"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ item_name: "Updated" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({
          request,
          orgId,
          user,
          supabase,
          params: { inspectionId, itemId },
        }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("removes an inspection item", async () => {
      removeInspectionItemMock.mockResolvedValue(undefined);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, { method: "DELETE" });
      const response = await (DELETE as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId, itemId },
      });

      expect(removeInspectionItemMock).toHaveBeenCalledWith(
        supabase,
        inspectionId,
        itemId,
        orgId,
      );
      expect(response.status).toBe(204);
    });

    it("returns 400 when inspectionId is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, { method: "DELETE" });
      const response = await (DELETE as any)({
        request,
        orgId,
        user,
        supabase,
        params: { itemId },
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 when itemId is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, { method: "DELETE" });
      const response = await (DELETE as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId },
      });
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      removeInspectionItemMock.mockRejectedValue(new Error("DB error"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl, { method: "DELETE" });
      await expect(
        (DELETE as any)({
          request,
          orgId,
          user,
          supabase,
          params: { inspectionId, itemId },
        }),
      ).rejects.toThrow("DB error");
    });
  });
});
