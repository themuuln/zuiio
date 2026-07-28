import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getInventoryMovementsMock = vi.fn();
const createMovementMock = vi.fn();

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
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getInventoryMovements: getInventoryMovementsMock,
  createMovement: createMovementMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/movements route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns movements with default limit when no params", async () => {
      getInventoryMovementsMock.mockResolvedValue([
        { id: "mov-1", movement_type: "in" },
      ]);

      const request = new NextRequest(
        "http://localhost/api/organizations/org-1/inventory/movements",
      );
      const response = await (GET as any)({ supabase: {}, orgId, request });
      const body = await response.json();

      expect(getInventoryMovementsMock).toHaveBeenCalledWith(
        {},
        orgId,
        undefined,
        50,
        undefined,
        undefined,
        undefined,
      );
      expect(body.data).toEqual([{ id: "mov-1", movement_type: "in" }]);
    });

    it("filters by movement_type", async () => {
      getInventoryMovementsMock.mockResolvedValue([
        { id: "mov-2", movement_type: "transfer" },
      ]);

      const request = new NextRequest(
        "http://localhost/api/organizations/org-1/inventory/movements?movement_type=transfer",
      );
      const response = await (GET as any)({ supabase: {}, orgId, request });
      const body = await response.json();

      expect(getInventoryMovementsMock).toHaveBeenCalledWith(
        {},
        orgId,
        "transfer",
        50,
        undefined,
        undefined,
        undefined,
      );
      expect(body.data).toEqual([{ id: "mov-2", movement_type: "transfer" }]);
    });

    it("filters by branch_id", async () => {
      getInventoryMovementsMock.mockResolvedValue([
        { id: "mov-3", branch_id: "branch-1" },
      ]);

      const request = new NextRequest(
        "http://localhost/api/organizations/org-1/inventory/movements?branch_id=branch-1",
      );
      const response = await (GET as any)({ supabase: {}, orgId, request });
      const body = await response.json();

      expect(getInventoryMovementsMock).toHaveBeenCalledWith(
        {},
        orgId,
        undefined,
        50,
        undefined,
        undefined,
        "branch-1",
      );
      expect(body.data).toEqual([{ id: "mov-3", branch_id: "branch-1" }]);
    });

    it("honors a custom limit", async () => {
      getInventoryMovementsMock.mockResolvedValue([
        { id: "mov-4" },
        { id: "mov-5" },
      ]);

      const request = new NextRequest(
        "http://localhost/api/organizations/org-1/inventory/movements?limit=10",
      );
      const response = await (GET as any)({ supabase: {}, orgId, request });
      const body = await response.json();

      expect(getInventoryMovementsMock).toHaveBeenCalledWith(
        {},
        orgId,
        undefined,
        10,
        undefined,
        undefined,
        undefined,
      );
      expect(body.data).toEqual([{ id: "mov-4" }, { id: "mov-5" }]);
    });

    it("handles service error", async () => {
      getInventoryMovementsMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(
        "http://localhost/api/organizations/org-1/inventory/movements",
      );
      await expect(
        (GET as any)({ supabase: {}, orgId, request }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = "http://localhost/api/organizations/org-1/inventory/movements";

    it("creates a movement", async () => {
      createMovementMock.mockResolvedValue({
        id: "mov-1",
        movement_type: "in",
      });
      const body = { movement_type: "in", quantity: 5, part_id: "part-1" };

      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        supabase: {},
        orgId,
        request,
        user,
      });
      const data = await response.json();

      expect(createMovementMock).toHaveBeenCalledWith({}, orgId, body, user.id);
      expect(data.data).toEqual({ id: "mov-1", movement_type: "in" });
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      createMovementMock.mockRejectedValue(new Error("Insufficient stock"));

      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ movement_type: "out", quantity: 999 }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase: {}, orgId, request, user }),
      ).rejects.toThrow("Insufficient stock");
    });
  });
});
