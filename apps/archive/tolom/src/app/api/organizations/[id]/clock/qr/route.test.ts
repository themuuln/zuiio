import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const generateClockTokenMock = vi.fn();

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
  generateClockToken: generateClockTokenMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/clock/qr route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/clock/qr`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns created token on success", async () => {
      const token = {
        raw_token: "tok_abc123",
        expires_at: "2026-01-01T00:00:00Z",
      };
      generateClockTokenMock.mockResolvedValue(token);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ actionType: "clock_in" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        supabase: {},
      });
      const body = await response.json();

      expect(generateClockTokenMock).toHaveBeenCalledWith(
        {},
        orgId,
        "clock_in",
      );
      expect(body.data).toEqual(token);
      expect(response.status).toBe(201);
    });

    it("returns apiError when actionType is missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("returns apiError when actionType is invalid", async () => {
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ actionType: "invalid" as any }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("handles service error", async () => {
      generateClockTokenMock.mockRejectedValue(
        new Error("Token generation failed"),
      );

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ actionType: "clock_out" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("Token generation failed");
    });
  });
});
