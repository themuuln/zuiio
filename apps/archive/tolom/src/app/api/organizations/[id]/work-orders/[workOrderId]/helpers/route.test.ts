import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const assignHelperMock = vi.fn();
const removeHelperMock = vi.fn();
const reorderHelpersMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/bay-view-service", () => ({
  assignHelperToWorkOrder: assignHelperMock,
  removeHelperFromWorkOrder: removeHelperMock,
  reorderWorkOrderHelpers: reorderHelpersMock,
}));

const { POST, DELETE, PUT } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/work-orders/[workOrderId]/helpers route", () => {
  const orgId = "org-1";
  const workOrderId = "wo-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("assigns helper on success", async () => {
      assignHelperMock.mockResolvedValue(undefined);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ mechanic_id: "mech-1" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
        user,
      });
      const body = await response.json();

      expect(assignHelperMock).toHaveBeenCalledWith(
        {},
        orgId,
        workOrderId,
        "mech-1",
        "user-1",
      );
      expect(response.status).toBe(201);
      expect(body.data).toBeNull();
    });

    it("returns validation error when mechanic_id is missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
        user,
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns validation error when mechanic_id is not a string", async () => {
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ mechanic_id: 123 }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
        user,
      });

      expect(response.status).toBe(400);
    });

    it("propagates service errors", async () => {
      assignHelperMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ mechanic_id: "mech-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({
          request,
          params: { workOrderId },
          orgId,
          supabase: {},
          user,
        }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── DELETE ─────────────────────────────────────────

  describe("DELETE", () => {
    it("removes helper on success", async () => {
      removeHelperMock.mockResolvedValue(undefined);

      const request = new NextRequest(`${baseUrl}?mechanicId=mech-1`, {
        method: "DELETE",
      });
      const response = await (DELETE as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
      });
      const body = await response.json();

      expect(removeHelperMock).toHaveBeenCalledWith(
        {},
        orgId,
        workOrderId,
        "mech-1",
      );
      expect(response.status).toBe(200);
      expect(body.data).toBeNull();
    });

    it("returns validation error when mechanicId query param is missing", async () => {
      const request = new NextRequest(baseUrl, { method: "DELETE" });
      const response = await (DELETE as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("mechanicId query param required");
    });

    it("propagates service errors", async () => {
      removeHelperMock.mockRejectedValue(new Error("Remove failed"));

      const request = new NextRequest(`${baseUrl}?mechanicId=mech-1`, {
        method: "DELETE",
      });
      await expect(
        (DELETE as any)({
          request,
          params: { workOrderId },
          orgId,
          supabase: {},
        }),
      ).rejects.toThrow("Remove failed");
    });
  });

  // ── PUT ────────────────────────────────────────────

  describe("PUT", () => {
    it("reorders helpers on success", async () => {
      reorderHelpersMock.mockResolvedValue(undefined);
      const ids = ["mech-2", "mech-1"];

      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ mechanic_ids: ids }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
      });
      const body = await response.json();

      expect(reorderHelpersMock).toHaveBeenCalledWith(
        {},
        orgId,
        workOrderId,
        ids,
      );
      expect(response.status).toBe(200);
      expect(body.data).toBeNull();
    });

    it("returns validation error when mechanic_ids is not an array", async () => {
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ mechanic_ids: "not-an-array" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns validation error when mechanic_ids is empty", async () => {
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ mechanic_ids: [] }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns validation error when mechanic_ids is missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (PUT as any)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
      });

      expect(response.status).toBe(400);
    });

    it("propagates service errors", async () => {
      reorderHelpersMock.mockRejectedValue(new Error("Reorder failed"));

      const request = new NextRequest(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ mechanic_ids: ["mech-1"] }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PUT as any)({
          request,
          params: { workOrderId },
          orgId,
          supabase: {},
        }),
      ).rejects.toThrow("Reorder failed");
    });
  });
});
