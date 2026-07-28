import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const addCashOutMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
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

vi.mock("@/lib/services/cash-register-service", () => ({
  addCashOut: addCashOutMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/cash-register/[sessionId]/cash-out route", () => {
  const orgId = "org-1";
  const userId = "user-1";
  const sessionId = "session-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/cash-register/${sessionId}/cash-out`;
  const params = { sessionId };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("records cash out with valid body", async () => {
      const entry = {
        id: "entry-1",
        amount: 500,
        description: "Office supplies",
      };
      addCashOutMock.mockResolvedValue(entry);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ amount: 500, description: "Office supplies" }),
        headers: { "content-type": "application/json" },
      });

      const response = await (POST as any)({
        orgId,
        user: { id: userId },
        supabase: {},
        params,
        request,
      });
      const body = await response.json();

      expect(addCashOutMock).toHaveBeenCalledWith(
        {},
        params.sessionId,
        orgId,
        userId,
        500,
        "Office supplies",
      );
      expect(body.data).toEqual(entry);
      expect(response.status).toBe(201);
    });

    it("returns apiError when amount is missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ description: "Office supplies" }),
        headers: { "content-type": "application/json" },
      });

      const response = await (POST as any)({
        orgId,
        user: { id: userId },
        supabase: {},
        params,
        request,
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Amount must be positive");
      expect(response.status).toBe(400);
      expect(addCashOutMock).not.toHaveBeenCalled();
    });

    it("returns apiError when description is missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ amount: 500 }),
        headers: { "content-type": "application/json" },
      });

      const response = await (POST as any)({
        orgId,
        user: { id: userId },
        supabase: {},
        params,
        request,
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Description is required");
      expect(response.status).toBe(400);
      expect(addCashOutMock).not.toHaveBeenCalled();
    });

    it("handles service error", async () => {
      addCashOutMock.mockRejectedValue(new Error("Cash register not open"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ amount: 500, description: "Office supplies" }),
        headers: { "content-type": "application/json" },
      });

      await expect(
        (POST as any)({
          orgId,
          user: { id: userId },
          supabase: {},
          params,
          request,
        }),
      ).rejects.toThrow("Cash register not open");
    });
  });
});
