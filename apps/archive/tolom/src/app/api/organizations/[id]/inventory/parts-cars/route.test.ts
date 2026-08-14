import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getPartsCarsMock = vi.fn();
const createPartsCarMock = vi.fn();

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

vi.mock("@/lib/services/parts-cars-service", () => ({
  getPartsCars: getPartsCarsMock,
  createPartsCar: createPartsCarMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts-cars route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns the parts-cars list", async () => {
      getPartsCarsMock.mockResolvedValue([
        { id: "car-1", name: "Toyota Corolla" },
      ]);

      const response = await (GET as any)({ supabase: {}, orgId });
      const body = await response.json();

      expect(getPartsCarsMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual([{ id: "car-1", name: "Toyota Corolla" }]);
    });

    it("handles service error", async () => {
      getPartsCarsMock.mockRejectedValue(new Error("DB error"));

      await expect((GET as any)({ supabase: {}, orgId })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = "http://localhost/api/organizations/org-1/inventory/parts-cars";

    it("creates a parts-car", async () => {
      createPartsCarMock.mockResolvedValue({ id: "car-1" });
      const body = { name: "Honda Civic", year: 2020 };

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

      expect(createPartsCarMock).toHaveBeenCalledWith({}, orgId, user.id, body);
      expect(data.data).toEqual({ id: "car-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      createPartsCarMock.mockRejectedValue(new Error("Validation failed"));

      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ name: "" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase: {}, orgId, request, user }),
      ).rejects.toThrow("Validation failed");
    });
  });
});
