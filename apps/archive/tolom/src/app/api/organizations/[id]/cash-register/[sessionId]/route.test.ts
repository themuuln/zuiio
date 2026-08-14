import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getSessionMock = vi.fn();
const voidSessionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/cash-register-service", () => ({
  getSession: getSessionMock,
  voidSession: voidSessionMock,
}));

const { GET, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/cash-register/[sessionId] route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const sessionId = "session-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns session detail on success", async () => {
      const session = {
        id: sessionId,
        branch_id: "branch-1",
        opened_at: "2025-01-15T08:00:00Z",
        status: "open",
      };
      getSessionMock.mockResolvedValue(session);

      const supabase = createMockSupabaseClient();
      const params = { sessionId };
      const response = await (GET as any)({ orgId, supabase, params });
      const body = await response.json();

      expect(getSessionMock).toHaveBeenCalledWith(supabase, sessionId, orgId);
      expect(body.data).toEqual(session);
    });

    it("returns null when session not found", async () => {
      getSessionMock.mockResolvedValue(null);

      const supabase = createMockSupabaseClient();
      const params = { sessionId };
      const response = await (GET as any)({ orgId, supabase, params });
      const body = await response.json();

      expect(getSessionMock).toHaveBeenCalledWith(supabase, sessionId, orgId);
      expect(body.data).toBeNull();
    });

    it("handles service error", async () => {
      getSessionMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const params = { sessionId };
      await expect((GET as any)({ orgId, supabase, params })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("voids session on success", async () => {
      voidSessionMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const params = { sessionId };
      const response = await (DELETE as any)({
        orgId,
        user,
        supabase,
        params,
      });
      const body = await response.json();

      expect(voidSessionMock).toHaveBeenCalledWith(
        supabase,
        sessionId,
        orgId,
        user.id,
      );
      expect(body.data).toEqual({ success: true });
    });

    it("handles service error", async () => {
      voidSessionMock.mockRejectedValue(new Error("Void failed"));

      const supabase = createMockSupabaseClient();
      const params = { sessionId };
      await expect(
        (DELETE as any)({ orgId, user, supabase, params }),
      ).rejects.toThrow("Void failed");
    });
  });
});
