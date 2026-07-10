import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logAuditAfter } from "@/lib/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  addCashOut,
  closeSession,
  getCurrentSession,
  getSession,
  getSessions,
  openSession,
  voidSession,
} from "./cash-register-service";

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
  logAuditAfter: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

describe("cash-register-service", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockClient = createMockSupabaseClient() as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _sessionsQb = (mockClient.from as any)("cash_register_sessions");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _entriesQb = (mockClient.from as any)("cash_register_entries");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── openSession ────────────────────────────────────────

  describe("openSession", () => {
    it("creates a session with valid data", async () => {
      // No existing open session
      mockClient
        .from("cash_register_sessions")
        .maybeSingle.mockResolvedValueOnce({
          data: null,
          error: null,
        });

      // Insert succeeds
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: {
          id: "session-1",
          organization_id: "org-1",
          branch_id: null,
          date: "2026-06-10",
          status: "open",
          opened_at: "2026-06-10T09:00:00Z",
          opening_balance: 500000,
          created_at: "2026-06-10T09:00:00Z",
        },
        error: null,
      });

      const result = await openSession(mockClient, "org-1", "user-1", 500000);

      expect(result.id).toBe("session-1");
      expect(result.opening_balance).toBe(500000);
      expect(result.status).toBe("open");
      expect(logAuditAfter).toHaveBeenCalled();
      expect(revalidateTag).toHaveBeenCalled();
    });

    it("throws ConflictError if session already open", async () => {
      mockClient
        .from("cash_register_sessions")
        .maybeSingle.mockResolvedValueOnce({
          data: { id: "existing-session" },
          error: null,
        });

      await expect(
        openSession(mockClient, "org-1", "user-1", 500000),
      ).rejects.toThrow(ConflictError);
    });

    it("throws ValidationError for negative balance", async () => {
      await expect(
        openSession(mockClient, "org-1", "user-1", -100),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ── closeSession ───────────────────────────────────────

  describe("closeSession", () => {
    it("closes session and computes discrepancy", async () => {
      // Fetch session
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: {
          id: "session-1",
          organization_id: "org-1",
          status: "open",
          opening_balance: 500000,
        },
        error: null,
      });

      // Fetch entries
      mockClient
        .from("cash_register_entries")
        .select.mockReturnValueOnce(mockClient.from("cash_register_entries"));
      mockClient
        .from("cash_register_entries")
        .eq.mockReturnValueOnce(mockClient.from("cash_register_entries"));
      // Entries resolve via then
      const entriesQb = mockClient.from("cash_register_entries");
      // biome-ignore lint/suspicious/noThenProperty: mock thenable query builder
      entriesQb.then = (onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: [
            { entry_type: "in", amount: 300000 },
            { entry_type: "out", amount: 50000 },
          ],
          error: null,
        }).then(onFulfilled);

      // Update succeeds
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: {
          id: "session-1",
          status: "closed",
          closing_balance: 740000,
          expected_balance: 750000,
          cash_in: 300000,
          cash_out: 50000,
          discrepancy: -10000,
        },
        error: null,
      });

      const result = await closeSession(
        mockClient,
        "session-1",
        "org-1",
        "user-1",
        740000,
      );

      expect(result.status).toBe("closed");
      expect(result.discrepancy).toBe(-10000);
      expect(result.expected_balance).toBe(750000);
      expect(logAuditAfter).toHaveBeenCalled();
    });

    it("throws NotFoundError if session not found", async () => {
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: null,
        error: { message: "not found" },
      });

      await expect(
        closeSession(mockClient, "bad-id", "org-1", "user-1", 100),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError if already closed", async () => {
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: { id: "session-1", status: "closed" },
        error: null,
      });

      await expect(
        closeSession(mockClient, "session-1", "org-1", "user-1", 100),
      ).rejects.toThrow(ConflictError);
    });
  });

  // ── getCurrentSession ──────────────────────────────────

  describe("getCurrentSession", () => {
    it("returns session when open", async () => {
      mockClient
        .from("cash_register_sessions")
        .maybeSingle.mockResolvedValueOnce({
          data: { id: "session-1", status: "open" },
          error: null,
        });

      const result = await getCurrentSession(mockClient, "org-1");
      expect(result?.id).toBe("session-1");
    });

    it("returns null when no session", async () => {
      mockClient
        .from("cash_register_sessions")
        .maybeSingle.mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const result = await getCurrentSession(mockClient, "org-1");
      expect(result).toBeNull();
    });
  });

  // ── getSession ─────────────────────────────────────────

  describe("getSession", () => {
    it("returns session with entries", async () => {
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: { id: "session-1", status: "open" },
        error: null,
      });

      mockClient
        .from("cash_register_entries")
        .order.mockReturnValueOnce(mockClient.from("cash_register_entries"));
      const entriesQb = mockClient.from("cash_register_entries");
      // biome-ignore lint/suspicious/noThenProperty: mock thenable query builder
      entriesQb.then = (onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: [{ id: "entry-1", entry_type: "in", amount: 100000 }],
          error: null,
        }).then(onFulfilled);

      const result = await getSession(mockClient, "session-1", "org-1");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].amount).toBe(100000);
    });

    it("throws NotFoundError if not found", async () => {
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: null,
        error: { message: "not found" },
      });

      await expect(getSession(mockClient, "bad-id", "org-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  // ── addCashOut ─────────────────────────────────────────

  describe("addCashOut", () => {
    it("records a cash out entry", async () => {
      // Verify session is open
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: { id: "session-1", status: "open" },
        error: null,
      });

      // Insert entry
      mockClient.from("cash_register_entries").single.mockResolvedValueOnce({
        data: {
          id: "entry-1",
          session_id: "session-1",
          entry_type: "out",
          amount: 25000,
          source: "manual",
          description: "Change for customer",
        },
        error: null,
      });

      const result = await addCashOut(
        mockClient,
        "session-1",
        "org-1",
        "user-1",
        25000,
        "Change for customer",
      );

      expect(result.entry_type).toBe("out");
      expect(result.amount).toBe(25000);
      expect(revalidateTag).toHaveBeenCalled();
    });

    it("throws ValidationError for zero amount", async () => {
      await expect(
        addCashOut(mockClient, "session-1", "org-1", "user-1", 0, "desc"),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for empty description", async () => {
      await expect(
        addCashOut(mockClient, "session-1", "org-1", "user-1", 100, ""),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ConflictError if session is closed", async () => {
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: { id: "session-1", status: "closed" },
        error: null,
      });

      await expect(
        addCashOut(mockClient, "session-1", "org-1", "user-1", 100, "desc"),
      ).rejects.toThrow(ConflictError);
    });
  });

  // ── voidSession ────────────────────────────────────────

  describe("voidSession", () => {
    it("soft-deletes an open session with no entries", async () => {
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: { id: "session-1", status: "open" },
        error: null,
      });

      // Count entries = 0
      mockClient
        .from("cash_register_entries")
        .select.mockReturnValueOnce(mockClient.from("cash_register_entries"));
      mockClient
        .from("cash_register_entries")
        .eq.mockReturnValueOnce(mockClient.from("cash_register_entries"));
      const countQb = mockClient.from("cash_register_entries");
      // biome-ignore lint/suspicious/noThenProperty: mock thenable query builder
      countQb.then = (onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ count: 0, error: null }).then(onFulfilled);

      // Update succeeds
      mockClient
        .from("cash_register_sessions")
        .update.mockReturnValueOnce(mockClient.from("cash_register_sessions"));

      await voidSession(mockClient, "session-1", "org-1", "user-1");

      expect(logAuditAfter).toHaveBeenCalled();
      expect(revalidateTag).toHaveBeenCalled();
    });

    it("throws ConflictError if session has entries", async () => {
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: { id: "session-1", status: "open" },
        error: null,
      });

      // Count entries > 0
      mockClient
        .from("cash_register_entries")
        .select.mockReturnValueOnce(mockClient.from("cash_register_entries"));
      mockClient
        .from("cash_register_entries")
        .eq.mockReturnValueOnce(mockClient.from("cash_register_entries"));
      const countQb = mockClient.from("cash_register_entries");
      // biome-ignore lint/suspicious/noThenProperty: mock thenable query builder
      countQb.then = (onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ count: 3, error: null }).then(onFulfilled);

      await expect(
        voidSession(mockClient, "session-1", "org-1", "user-1"),
      ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError if session is closed", async () => {
      mockClient.from("cash_register_sessions").single.mockResolvedValueOnce({
        data: { id: "session-1", status: "closed" },
        error: null,
      });

      await expect(
        voidSession(mockClient, "session-1", "org-1", "user-1"),
      ).rejects.toThrow(ConflictError);
    });
  });

  // ── getSessions ────────────────────────────────────────

  describe("getSessions", () => {
    it("returns paginated sessions", async () => {
      mockClient
        .from("cash_register_sessions")
        .range.mockReturnValueOnce(mockClient.from("cash_register_sessions"));
      const listQb = mockClient.from("cash_register_sessions");
      // biome-ignore lint/suspicious/noThenProperty: mock thenable query builder
      listQb.then = (onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: [{ id: "s1" }, { id: "s2" }],
          count: 2,
          error: null,
        }).then(onFulfilled);

      const result = await getSessions(mockClient, "org-1", { limit: 10 });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
