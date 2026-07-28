import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getStockThresholdsMock = vi.fn();
const setStockThresholdMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getStockThresholds: getStockThresholdsMock,
  setStockThreshold: setStockThresholdMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/thresholds route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/thresholds`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ─────────────────────────────────────────────

  describe("GET", () => {
    it("calls getStockThresholds with no branch_id when not provided", async () => {
      const thresholds = [
        { part_id: "part-1", min_quantity: 5, max_quantity: 50 },
      ];
      getStockThresholdsMock.mockResolvedValue(thresholds);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getStockThresholdsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
      );
      expect(body.data).toEqual(thresholds);
    });

    it("forwards branch_id param", async () => {
      const thresholds = [
        { part_id: "part-2", min_quantity: 3, max_quantity: 30 },
      ];
      getStockThresholdsMock.mockResolvedValue(thresholds);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getStockThresholdsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "branch-1",
      );
      expect(body.data).toEqual(thresholds);
    });

    it("handles service error", async () => {
      getStockThresholdsMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ────────────────────────────────────────────

  describe("POST", () => {
    it("creates a stock threshold", async () => {
      const newThreshold = {
        id: "threshold-1",
        part_id: "part-1",
        min_quantity: 5,
        max_quantity: 50,
      };
      setStockThresholdMock.mockResolvedValue(newThreshold);
      const body = {
        part_id: "part-1",
        branch_id: "branch-1",
        min_quantity: 5,
        max_quantity: 50,
      };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(setStockThresholdMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual(newThreshold);
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      setStockThresholdMock.mockRejectedValue(new Error("Invalid threshold"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ part_id: "" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Invalid threshold");
    });
  });
});
