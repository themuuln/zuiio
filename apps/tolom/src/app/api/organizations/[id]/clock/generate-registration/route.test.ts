import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const generateRegistrationTokenMock = vi.fn();

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
  generateRegistrationToken: generateRegistrationTokenMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/clock/generate-registration route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/clock/generate-registration`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns created token on success", async () => {
    const token = { token: "qr-tok-123", session_id: "sess-1" };
    generateRegistrationTokenMock.mockResolvedValue(token);

    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: JSON.stringify({ mechanicId: "mech-1" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({ request, orgId, supabase: {} });
    const body = await response.json();

    expect(generateRegistrationTokenMock).toHaveBeenCalledWith(
      {},
      orgId,
      "mech-1",
    );
    expect(body.data).toEqual(token);
    expect(response.status).toBe(201);
  });

  it("returns apiError when mechanicId is missing", async () => {
    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({ request, orgId, supabase: {} });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(generateRegistrationTokenMock).not.toHaveBeenCalled();
  });

  it("handles service error", async () => {
    generateRegistrationTokenMock.mockRejectedValue(
      new Error("Token generation failed"),
    );

    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: JSON.stringify({ mechanicId: "mech-1" }),
      headers: { "content-type": "application/json" },
    });
    await expect(
      (POST as any)({ request, orgId, supabase: {} }),
    ).rejects.toThrow("Token generation failed");
  });
});
