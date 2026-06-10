import { describe, expect, it, vi } from "vitest";
import {
  cancelFollowup,
  completeFollowup,
  createFollowup,
  deleteFollowup,
  getFollowup,
  getOverdueFollowups,
  listFollowups,
  updateFollowup,
} from "./followup-service";

function mockDb(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "f1" }, error: null }),
    ...overrides,
  };
  return {
    from: vi.fn().mockReturnValue(chain),
  };
}

const orgId = "org-test-1";
const followupId = "f1";

describe("FollowupService", () => {
  describe("createFollowup", () => {
    it("creates a follow-up with required fields", async () => {
      const db = mockDb();
      const result = await createFollowup(db as never, orgId, {
        customer_id: "c1",
        subject: "Callback about brakes",
        due_at: "2026-07-01T10:00:00Z",
      });

      expect(result).toEqual({ id: "f1" });
      expect(db.from).toHaveBeenCalledWith("customer_followups");
    });

    it("includes optional fields when provided", async () => {
      const db = mockDb();
      await createFollowup(db as never, orgId, {
        customer_id: "c1",
        vehicle_id: "v1",
        work_order_id: "wo1",
        subject: "Follow up on repair",
        notes: "Customer asked for callback",
        type: "email",
        due_at: "2026-07-01T10:00:00Z",
        assigned_to: "user1",
      });

      const insertCall = db.from().insert;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicle_id: "v1",
          work_order_id: "wo1",
          type: "email",
          notes: "Customer asked for callback",
        }),
      );
    });
  });

  describe("getFollowup", () => {
    it("fetches follow-up by id and orgId", async () => {
      const db = mockDb();
      const result = await getFollowup(db as never, followupId, orgId);

      expect(result).toEqual({ id: "f1" });
      expect(db.from).toHaveBeenCalledWith("customer_followups");
    });

    it("returns null for PGRST116 error", async () => {
      const db = mockDb({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        }),
      });
      const result = await getFollowup(db as never, "nonexistent", orgId);
      expect(result).toBeNull();
    });
  });

  describe("listFollowups", () => {
    it("lists follow-ups with default pagination", async () => {
      const db = mockDb({
        single: undefined,
        range: vi
          .fn()
          .mockResolvedValue({ data: [{ id: "f1" }], count: 1, error: null }),
      });
      const result = await listFollowups(db as never, orgId);

      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it("filters by customerId", async () => {
      const db = mockDb({
        single: undefined,
        range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      });
      await listFollowups(db as never, orgId, { customerId: "c1" });

      const eqCalls = db.from().eq.mock.calls;
      expect(eqCalls.some((c: unknown[]) => c[0] === "customer_id")).toBe(true);
    });

    it("filters by status", async () => {
      const db = mockDb({
        single: undefined,
        range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      });
      await listFollowups(db as never, orgId, { status: "pending" });

      const eqCalls = db.from().eq.mock.calls;
      expect(eqCalls.some((c: unknown[]) => c[0] === "status")).toBe(true);
    });
  });

  describe("updateFollowup", () => {
    it("updates follow-up fields", async () => {
      const db = mockDb();
      const result = await updateFollowup(db as never, followupId, orgId, {
        subject: "Updated subject",
        notes: "Updated notes",
      });

      expect(result).toEqual({ id: "f1" });
      expect(db.from().update).toHaveBeenCalledWith({
        subject: "Updated subject",
        notes: "Updated notes",
      });
    });
  });

  describe("completeFollowup", () => {
    it("sets status to completed with outcome", async () => {
      const db = mockDb();
      const result = await completeFollowup(
        db as never,
        followupId,
        orgId,
        "Customer approved",
        "Will come in Thursday",
      );

      expect(result).toEqual({ id: "f1" });
      const updateCall = db.from().update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          outcome: "Customer approved",
          outcome_notes: "Will come in Thursday",
        }),
      );
    });
  });

  describe("cancelFollowup", () => {
    it("sets status to cancelled", async () => {
      const db = mockDb();
      const result = await cancelFollowup(db as never, followupId, orgId);

      expect(result).toEqual({ id: "f1" });
      const updateCall = db.from().update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
        }),
      );
    });
  });

  describe("deleteFollowup", () => {
    it("soft-deletes a follow-up", async () => {
      const db = mockDb();
      await deleteFollowup(db as never, followupId, orgId);

      const updateCall = db.from().update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        }),
      );
    });
  });

  describe("getOverdueFollowups", () => {
    it("returns pending follow-ups past due date", async () => {
      const db = mockDb({
        single: undefined,
        order: vi.fn().mockResolvedValue({ data: [{ id: "f1" }], error: null }),
      });
      const result = await getOverdueFollowups(db as never, orgId);

      expect(result).toHaveLength(1);
      expect(db.from).toHaveBeenCalledWith("customer_followups");
    });
  });
});
