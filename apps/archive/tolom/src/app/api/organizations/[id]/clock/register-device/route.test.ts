import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const registerDeviceMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  createRouteHandler: vi.fn((handler: unknown) => handler),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/qr-token-service", () => ({
  registerDevice: registerDeviceMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/clock/register-device route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/clock/register-device`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns created device on success", async () => {
    const device = { deviceId: "dev-1" };
    registerDeviceMock.mockResolvedValue(device);

    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: JSON.stringify({
        registrationToken: "reg-tok-1",
        deviceFingerprint: "fp-abc123",
        deviceName: "Front Desk",
      }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({ request, orgId, supabase: {} });
    const body = await response.json();

    expect(registerDeviceMock).toHaveBeenCalledWith(
      {},
      orgId,
      "reg-tok-1",
      "fp-abc123",
      "Front Desk",
    );
    expect(body.data).toEqual({ deviceId: "dev-1" });
    expect(response.status).toBe(201);
  });

  it("returns apiError when registrationToken is missing", async () => {
    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: JSON.stringify({ deviceFingerprint: "fp-abc123" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({ request, orgId, supabase: {} });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(registerDeviceMock).not.toHaveBeenCalled();
  });

  it("returns apiError when deviceFingerprint is missing", async () => {
    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: JSON.stringify({ registrationToken: "reg-tok-1" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({ request, orgId, supabase: {} });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(registerDeviceMock).not.toHaveBeenCalled();
  });

  it("handles service error", async () => {
    registerDeviceMock.mockRejectedValue(
      new Error("Device registration failed"),
    );

    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: JSON.stringify({
        registrationToken: "reg-tok-1",
        deviceFingerprint: "fp-abc123",
      }),
      headers: { "content-type": "application/json" },
    });
    await expect(
      (POST as any)({ request, orgId, supabase: {} }),
    ).rejects.toThrow("Device registration failed");
  });
});
