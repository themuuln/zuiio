import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getServiceMock = vi.fn();
const updateServiceMock = vi.fn();
const deleteServiceMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/service-catalog-service", () => ({
  getService: getServiceMock,
  updateService: updateServiceMock,
  deleteService: deleteServiceMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/services/[serviceId] route", () => {
  const orgId = "org-1";
  const serviceId = "svc-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/services/${serviceId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns service on success", async () => {
      const service = { id: serviceId, name: "Oil Change" };
      getServiceMock.mockResolvedValue(service);

      const response = await (GET as any)({
        params: { serviceId },
        supabase: {},
      });
      const body = await response.json();

      expect(getServiceMock).toHaveBeenCalledWith({}, serviceId);
      expect(body.data).toEqual(service);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getServiceMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (GET as any)({ params: { serviceId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("PATCH", () => {
    it("updates service on success", async () => {
      const updated = { id: serviceId, name: "Oil Change Premium" };
      updateServiceMock.mockResolvedValue(updated);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ name: "Oil Change Premium" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        params: { serviceId },
        supabase: {},
      });
      const body = await response.json();

      expect(updateServiceMock).toHaveBeenCalledWith({}, serviceId, orgId, {
        name: "Oil Change Premium",
      });
      expect(body.data).toEqual(updated);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      updateServiceMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ name: "Oil Change Premium" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ request, orgId, params: { serviceId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("deletes service on success", async () => {
      deleteServiceMock.mockResolvedValue(undefined);

      const response = await (DELETE as any)({
        request: new NextRequest(baseUrl, { method: "DELETE" }),
        orgId,
        params: { serviceId },
        supabase: {},
      });

      expect(deleteServiceMock).toHaveBeenCalledWith({}, serviceId, orgId);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      deleteServiceMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (DELETE as any)({
          request: new NextRequest(baseUrl, { method: "DELETE" }),
          orgId,
          params: { serviceId },
          supabase: {},
        }),
      ).rejects.toThrow("DB error");
    });
  });
});
