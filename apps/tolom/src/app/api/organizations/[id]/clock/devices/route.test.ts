import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getRegisteredDevicesMock = vi.fn();
const revokeDeviceMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/qr-token-service", () => ({
  getRegisteredDevices: getRegisteredDevicesMock,
  revokeDevice: revokeDeviceMock,
}));

const { GET, DELETE: DELETE_ROUTE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/clock/devices route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/clock/devices`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns devices on success", async () => {
      const devices = [{ device_id: "dev-1", mechanic_name: "John" }];
      getRegisteredDevicesMock.mockResolvedValue(devices);

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(getRegisteredDevicesMock).toHaveBeenCalledWith(
        {},
        orgId,
        undefined,
      );
      expect(body.data).toEqual(devices);
      expect(response.status).toBe(200);
    });

    it("filters by mechanicId when provided", async () => {
      getRegisteredDevicesMock.mockResolvedValue([]);

      const request = new NextRequest(`${baseUrl}?mechanicId=mech-1`);
      await (GET as any)({ request, orgId, supabase: {} });

      expect(getRegisteredDevicesMock).toHaveBeenCalledWith(
        {},
        orgId,
        "mech-1",
      );
    });

    it("handles service error", async () => {
      getRegisteredDevicesMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl);
      await expect(
        (GET as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("revokes device on success", async () => {
      revokeDeviceMock.mockResolvedValue(undefined);

      const request = new NextRequest(baseUrl, {
        method: "DELETE",
        body: JSON.stringify({ deviceId: "dev-1" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (DELETE_ROUTE as any)({ request, supabase: {} });

      expect(revokeDeviceMock).toHaveBeenCalledWith({}, "dev-1");
      expect(response.status).toBe(200);
    });

    it("returns 400 when deviceId is missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (DELETE_ROUTE as any)({ request, supabase: {} });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("handles service error", async () => {
      revokeDeviceMock.mockRejectedValue(new Error("Revoke error"));

      const request = new NextRequest(baseUrl, {
        method: "DELETE",
        body: JSON.stringify({ deviceId: "dev-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (DELETE_ROUTE as any)({ request, supabase: {} }),
      ).rejects.toThrow("Revoke error");
    });
  });
});
