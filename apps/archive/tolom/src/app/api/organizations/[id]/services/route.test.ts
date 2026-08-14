import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getServicesMock = vi.fn();
const createServiceMock = vi.fn();

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

vi.mock("@/lib/services/service-catalog-service", () => ({
  getServices: getServicesMock,
  createService: createServiceMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/services route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/services`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns services on success", async () => {
      const services = [
        { id: "svc-1", name: "Oil Change", category: "maintenance" },
      ];
      getServicesMock.mockResolvedValue(services);

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(getServicesMock).toHaveBeenCalledWith({}, orgId, undefined);
      expect(body.data).toEqual(services);
      expect(response.status).toBe(200);
    });

    it("filters services by category", async () => {
      const services = [
        { id: "svc-1", name: "Oil Change", category: "maintenance" },
      ];
      getServicesMock.mockResolvedValue(services);

      const request = new NextRequest(`${baseUrl}?category=maintenance`);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(getServicesMock).toHaveBeenCalledWith({}, orgId, "maintenance");
      expect(body.data).toEqual(services);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getServicesMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl);
      await expect(
        (GET as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("POST", () => {
    it("creates a service on success", async () => {
      const service = {
        id: "svc-1",
        name: "Oil Change",
        category: "maintenance",
      };
      createServiceMock.mockResolvedValue(service);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Oil Change", category: "maintenance" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(createServiceMock).toHaveBeenCalledWith({}, orgId, {
        name: "Oil Change",
        category: "maintenance",
      });
      expect(body.data).toEqual(service);
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      createServiceMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Oil Change" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });
});
