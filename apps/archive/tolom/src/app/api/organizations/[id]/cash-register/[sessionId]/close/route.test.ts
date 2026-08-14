import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const closeSessionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/cash-register-service", () => ({
  closeSession: closeSessionMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/cash-register/[sessionId]/close route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const sessionId = "session-1";
  const url = `http://localhost/api/organizations/${orgId}/cash-register/${sessionId}/close`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("closes a session with closing_balance", async () => {
      const session = { id: sessionId, status: "closed" };
      closeSessionMock.mockResolvedValue(session);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ closing_balance: 5000, note: "End of day" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        orgId,
        user,
        supabase,
        params: { sessionId },
        request,
      });
      const data = await response.json();

      expect(closeSessionMock).toHaveBeenCalledWith(
        supabase,
        sessionId,
        orgId,
        user.id,
        5000,
        "End of day",
      );
      expect(data.data).toEqual(session);
    });

    it("returns 400 when closing_balance is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ note: "End of day" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        orgId,
        user,
        supabase,
        params: { sessionId },
        request,
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Closing balance is required");
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      closeSessionMock.mockRejectedValue(new Error("Session close failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ closing_balance: 5000 }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({
          orgId,
          user,
          supabase,
          params: { sessionId },
          request,
        }),
      ).rejects.toThrow("Session close failed");
    });
  });
});
