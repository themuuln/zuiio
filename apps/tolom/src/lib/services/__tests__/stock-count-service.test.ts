import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));

import { NotFoundError, ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";

import {
  addCountItem,
  cancelSession,
  createSession,
  getSession,
  listSessions,
  reconcileSession,
  removeCountItem,
} from "../stock-count-service";

const mockReportServerError = vi.mocked(reportServerError);

const ORG_ID = "org-1";
const USER_ID = "user-1";
const SESSION_ID = "session-1";
const PART_ID = "part-1";
const ITEM_ID = "item-1";

let db: ReturnType<typeof createMockSupabaseClient>;

const SESSION_DATA = {
  id: SESSION_ID,
  organization_id: ORG_ID,
  branch_id: null as string | null,
  status: "in_progress" as const,
  counted_by: USER_ID,
  total_items: 0,
  total_variance: 0,
  notes: null as string | null,
  started_at: "2025-01-15T10:00:00Z",
  completed_at: null as string | null,
};

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── createSession ────────────────────────────────────────────────────────────

describe("createSession", () => {
  it("creates a session with in_progress status and returns correct fields", async () => {
    db.__qb.resolveOnce({ data: { ...SESSION_DATA }, error: null });

    const result = await createSession(db as never, ORG_ID, USER_ID);

    expect(result.id).toBe(SESSION_ID);
    expect(result.status).toBe("in_progress");
    expect(result.organization_id).toBe(ORG_ID);
    expect(result.counted_by).toBe(USER_ID);
    expect(result.branch_id).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.total_items).toBe(0);
    expect(result.total_variance).toBe(0);
    expect(result.completed_at).toBeNull();

    // Verify the insert call
    expect(db.from).toHaveBeenCalledWith("stock_count_sessions");
  });

  it("accepts optional branch_id and notes", async () => {
    db.__qb.resolveOnce({
      data: { ...SESSION_DATA, branch_id: "branch-1", notes: "Test notes" },
      error: null,
    });

    const result = await createSession(
      db as never,
      ORG_ID,
      USER_ID,
      "branch-1",
      "Test notes",
    );

    expect(result.branch_id).toBe("branch-1");
    expect(result.notes).toBe("Test notes");
  });

  it("handles branch_id and notes as undefined gracefully", async () => {
    db.__qb.resolveOnce({
      data: { ...SESSION_DATA, branch_id: null, notes: null },
      error: null,
    });

    const result = await createSession(
      db as never,
      ORG_ID,
      USER_ID,
      undefined,
      undefined,
    );

    expect(result.branch_id).toBeNull();
    expect(result.notes).toBeNull();
  });

  it("throws on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "DB fail" } });

    await expect(createSession(db as never, ORG_ID, USER_ID)).rejects.toThrow(
      "DB fail",
    );
  });

  it("throws when no data returned", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(createSession(db as never, ORG_ID, USER_ID)).rejects.toThrow(
      "Failed to create stock count session",
    );
  });

  it("calls reportServerError on failure", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "fail" } });

    await expect(createSession(db as never, ORG_ID, USER_ID)).rejects.toThrow();
    expect(mockReportServerError).toHaveBeenCalledWith(
      "stockCount.createSession",
      expect.any(Error),
    );
  });
});

// ── getSession ───────────────────────────────────────────────────────────────

describe("getSession", () => {
  const fullSession = {
    ...SESSION_DATA,
    total_items: 2,
    total_variance: 2,
  };

  it("returns session with items and part info", async () => {
    db.__qb.resolveOnce({ data: { ...fullSession }, error: null });
    db.__qb.resolveOnce({
      data: [
        {
          id: "item-1",
          session_id: SESSION_ID,
          part_id: PART_ID,
          system_quantity: 10,
          physical_quantity: 12,
          variance: 2,
          notes: null,
          parts_catalog: { name: "Oil Filter", part_number: "OF-101" },
        },
        {
          id: "item-2",
          session_id: SESSION_ID,
          part_id: "part-2",
          system_quantity: 5,
          physical_quantity: 5,
          variance: 0,
          notes: null,
          parts_catalog: null,
        },
      ],
      error: null,
    });

    const result = await getSession(db as never, SESSION_ID);

    expect(result.id).toBe(SESSION_ID);
    expect(result.items).toHaveLength(2);

    // First item has part info
    expect(result.items[0].part_name).toBe("Oil Filter");
    expect(result.items[0].part_number).toBe("OF-101");
    expect(result.items[0].system_quantity).toBe(10);
    expect(result.items[0].physical_quantity).toBe(12);
    expect(result.items[0].variance).toBe(2);

    // Second item with null parts_catalog
    expect(result.items[1].part_name).toBeNull();
    expect(result.items[1].part_number).toBeNull();
    expect(result.items[1].variance).toBe(0);
  });

  it("throws NotFoundError when session not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(getSession(db as never, "x")).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError on session DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "db error" } });

    await expect(getSession(db as never, SESSION_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws on items DB error", async () => {
    db.__qb.resolveOnce({ data: { ...fullSession }, error: null });
    db.__qb.resolveOnce({ data: null, error: { message: "items fail" } });

    await expect(getSession(db as never, SESSION_ID)).rejects.toThrow(
      "items fail",
    );
  });

  it("returns empty items array when no items", async () => {
    db.__qb.resolveOnce({ data: { ...fullSession }, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getSession(db as never, SESSION_ID);
    expect(result.items).toEqual([]);
  });

  it("calls reportServerError on failure", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "fail" } });

    await expect(getSession(db as never, SESSION_ID)).rejects.toThrow();
    expect(mockReportServerError).toHaveBeenCalledWith(
      "stockCount.getSession",
      expect.any(Error),
    );
  });
});

// ── listSessions ─────────────────────────────────────────────────────────────

describe("listSessions", () => {
  const sessions = [
    {
      ...SESSION_DATA,
      id: "session-1",
      started_at: "2025-02-01T10:00:00Z",
    },
    {
      ...SESSION_DATA,
      id: "session-2",
      started_at: "2025-01-15T10:00:00Z",
    },
  ];

  it("returns all sessions with default limit of 20", async () => {
    db.__qb.resolveOnce({ data: sessions, error: null });

    const result = await listSessions(db as never, ORG_ID);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("session-1");
    expect(result[1].id).toBe("session-2");
  });

  it("filters sessions by status", async () => {
    db.__qb.resolveOnce({
      data: [sessions[0]],
      error: null,
    });

    const result = await listSessions(db as never, ORG_ID, "completed");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("session-1");
  });

  it("returns empty array when no data", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await listSessions(db as never, ORG_ID);
    expect(result).toEqual([]);
  });

  it("returns empty array for unknown status filter", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await listSessions(db as never, ORG_ID, "fake_status");
    expect(result).toEqual([]);
  });

  it("throws on DB error", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "list fail" } });

    await expect(listSessions(db as never, ORG_ID)).rejects.toThrow(
      "list fail",
    );
  });

  it("calls reportServerError on failure", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "fail" } });

    await expect(listSessions(db as never, ORG_ID)).rejects.toThrow();
    expect(mockReportServerError).toHaveBeenCalledWith(
      "stockCount.listSessions",
      expect.any(Error),
    );
  });
});

// ── addCountItem ─────────────────────────────────────────────────────────────

describe("addCountItem", () => {
  it("adds a count item with system_quantity from inventory_balances", async () => {
    // Step 1: Session check (.single())
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, status: "in_progress" },
      error: null,
    });

    // Step 2: Part lookup (.single())
    db.__qb.resolveOnce({
      data: { id: PART_ID, name: "Oil Filter", part_number: "OF-101" },
      error: null,
    });

    // maybeSingle for inventory_balances → default mock returns { data: null, error: null }
    // systemQuantity defaults to 0

    // Step 3: Insert item (.single())
    db.__qb.resolveOnce({
      data: {
        id: "new-item-1",
        session_id: SESSION_ID,
        part_id: PART_ID,
        system_quantity: 0,
        physical_quantity: 15,
        variance: null,
        notes: null,
      },
      error: null,
    });

    // Step 4: recalculateSessionTotals - items select (no terminal)
    db.__qb.resolveOnce({
      data: [],
      error: null,
    });

    // Step 5: recalculateSessionTotals - session update (no terminal)
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await addCountItem(
      db as never,
      ORG_ID,
      SESSION_ID,
      PART_ID,
      15,
    );

    expect(result.session_id).toBe(SESSION_ID);
    expect(result.part_id).toBe(PART_ID);
    expect(result.system_quantity).toBe(0);
    expect(result.physical_quantity).toBe(15);
    expect(result.part_name).toBe("Oil Filter");
    expect(result.part_number).toBe("OF-101");
  });

  it("uses balance quantity_on_hand as system_quantity", async () => {
    // Step 1: Session check (.single())
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, status: "in_progress" },
      error: null,
    });

    // Step 2: Part lookup (.single())
    db.__qb.resolveOnce({
      data: { id: PART_ID, name: "Oil Filter", part_number: "OF-101" },
      error: null,
    });

    // maybeSingle returns balance with quantity_on_hand
    // We need to override maybeSingle for this test since the default
    // mock resolves with { data: null, error: null }
    vi.mocked(db.from("inventory_balances").maybeSingle).mockResolvedValueOnce({
      data: { quantity_on_hand: 25 },
      error: null,
    } as never);

    // Step 3: Insert item (.single())
    db.__qb.resolveOnce({
      data: {
        id: "new-item-2",
        session_id: SESSION_ID,
        part_id: PART_ID,
        system_quantity: 25,
        physical_quantity: 30,
        variance: null,
        notes: "Adjusted",
      },
      error: null,
    });

    // Step 4: recalculateSessionTotals - items select
    db.__qb.resolveOnce({ data: [], error: null });

    // Step 5: recalculateSessionTotals - session update
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await addCountItem(
      db as never,
      ORG_ID,
      SESSION_ID,
      PART_ID,
      30,
      "Adjusted",
    );

    expect(result.system_quantity).toBe(25);
    expect(result.physical_quantity).toBe(30);
    expect(result.notes).toBe("Adjusted");
  });

  it("throws NotFoundError when session not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      addCountItem(db as never, ORG_ID, "x", PART_ID, 10),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when session is not in_progress", async () => {
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, status: "completed" },
      error: null,
    });

    await expect(
      addCountItem(db as never, ORG_ID, SESSION_ID, PART_ID, 10),
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError when part not found", async () => {
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, status: "in_progress" },
      error: null,
    });

    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      addCountItem(db as never, ORG_ID, SESSION_ID, "bad-part", 10),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws on insert error", async () => {
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, status: "in_progress" },
      error: null,
    });

    db.__qb.resolveOnce({
      data: { id: PART_ID, name: "Filter", part_number: "F-1" },
      error: null,
    });

    db.__qb.resolveOnce({ data: null, error: { message: "insert fail" } });

    await expect(
      addCountItem(db as never, ORG_ID, SESSION_ID, PART_ID, 10),
    ).rejects.toThrow("insert fail");
  });

  it("calls reportServerError on failure", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "fail" } });

    await expect(
      addCountItem(db as never, ORG_ID, SESSION_ID, PART_ID, 10),
    ).rejects.toThrow();
    expect(mockReportServerError).toHaveBeenCalledWith(
      "stockCount.addCountItem",
      expect.any(Error),
    );
  });
});

// ── removeCountItem ──────────────────────────────────────────────────────────

describe("removeCountItem", () => {
  it("removes a count item and recalculates totals", async () => {
    // Step 1: Item lookup (.single())
    db.__qb.resolveOnce({
      data: { id: ITEM_ID, session_id: SESSION_ID },
      error: null,
    });

    // Step 2: Session check (.single())
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, status: "in_progress" },
      error: null,
    });

    // Step 3: Delete (thenable, no terminal method)
    db.__qb.resolveOnce({ data: null, error: null });

    // Step 4: recalculateSessionTotals - items select
    db.__qb.resolveOnce({ data: [], error: null });

    // Step 5: recalculateSessionTotals - session update
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      removeCountItem(db as never, ORG_ID, ITEM_ID),
    ).resolves.toBeUndefined();
  });

  it("throws NotFoundError when item not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      removeCountItem(db as never, ORG_ID, "bad-item"),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError on item lookup error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: { message: "lookup fail" },
    });

    await expect(removeCountItem(db as never, ORG_ID, ITEM_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws NotFoundError when session not found", async () => {
    db.__qb.resolveOnce({
      data: { id: ITEM_ID, session_id: SESSION_ID },
      error: null,
    });

    db.__qb.resolveOnce({ data: null, error: null });

    await expect(removeCountItem(db as never, ORG_ID, ITEM_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws ValidationError when session is not in_progress", async () => {
    db.__qb.resolveOnce({
      data: { id: ITEM_ID, session_id: SESSION_ID },
      error: null,
    });

    db.__qb.resolveOnce({
      data: { id: SESSION_ID, status: "completed" },
      error: null,
    });

    await expect(removeCountItem(db as never, ORG_ID, ITEM_ID)).rejects.toThrow(
      ValidationError,
    );
  });

  it("throws on delete error", async () => {
    db.__qb.resolveOnce({
      data: { id: ITEM_ID, session_id: SESSION_ID },
      error: null,
    });

    db.__qb.resolveOnce({
      data: { id: SESSION_ID, status: "in_progress" },
      error: null,
    });

    // Delete error
    db.__qb.resolveOnce({ data: null, error: { message: "delete fail" } });

    await expect(removeCountItem(db as never, ORG_ID, ITEM_ID)).rejects.toThrow(
      "delete fail",
    );
  });

  it("calls reportServerError on failure", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      removeCountItem(db as never, ORG_ID, ITEM_ID),
    ).rejects.toThrow();
    expect(mockReportServerError).toHaveBeenCalledWith(
      "stockCount.removeCountItem",
      expect.any(Error),
    );
  });
});

// ── reconcileSession ─────────────────────────────────────────────────────────

describe("reconcileSession", () => {
  const completedSession = {
    ...SESSION_DATA,
    status: "completed" as const,
    branch_id: "branch-1",
    completed_at: "2025-01-15T11:00:00Z",
  };

  it("delegates reconciliation to the atomic RPC and returns its result", async () => {
    db.rpc.mockResolvedValueOnce({
      data: {
        session: completedSession,
        movements_created: 2,
      },
      error: null,
    });

    const result = await reconcileSession(
      db as never,
      ORG_ID,
      SESSION_ID,
      USER_ID,
    );

    expect(db.rpc).toHaveBeenCalledWith("reconcile_stock_count_session", {
      p_org_id: ORG_ID,
      p_session_id: SESSION_ID,
      p_user_id: USER_ID,
    });
    expect(result).toMatchObject({
      id: SESSION_ID,
      status: "completed",
      movements_created: 2,
    });
  });

  it("maps a missing session RPC error to NotFoundError", async () => {
    db.rpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "P0001",
        message: "Stock count session not found",
      },
    });

    await expect(
      reconcileSession(db as never, ORG_ID, SESSION_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("maps an invalid session RPC error to ValidationError", async () => {
    db.rpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "P0001",
        message: "Session is already completed or cancelled",
      },
    });

    await expect(
      reconcileSession(db as never, ORG_ID, SESSION_ID, USER_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("propagates database errors and reports them", async () => {
    db.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "42501", message: "not authorized" },
    });

    await expect(
      reconcileSession(db as never, ORG_ID, SESSION_ID, USER_ID),
    ).rejects.toThrow("not authorized");
    expect(mockReportServerError).toHaveBeenCalledWith(
      "stockCount.reconcileSession",
      expect.any(Error),
    );
  });

  it("rejects an empty RPC result", async () => {
    db.rpc.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      reconcileSession(db as never, ORG_ID, SESSION_ID, USER_ID),
    ).rejects.toThrow("Failed to reconcile stock count session");
  });
});

// ── cancelSession ────────────────────────────────────────────────────────────

describe("cancelSession", () => {
  it("updates session status to cancelled", async () => {
    // Step 1: Session check (.single())
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, notes: null, status: "in_progress" },
      error: null,
    });

    // Step 2: Update (.single())
    db.__qb.resolveOnce({
      data: {
        ...SESSION_DATA,
        status: "cancelled",
        notes: "Cancelled",
      },
      error: null,
    });

    const result = await cancelSession(db as never, ORG_ID, SESSION_ID);

    expect(result.status).toBe("cancelled");
    expect(result.notes).toBe("Cancelled");
  });

  it("appends 'Cancelled' to existing notes", async () => {
    db.__qb.resolveOnce({
      data: {
        id: SESSION_ID,
        notes: "Initial note",
        status: "in_progress",
      },
      error: null,
    });

    db.__qb.resolveOnce({
      data: {
        ...SESSION_DATA,
        status: "cancelled",
        notes: "Initial note - Cancelled",
      },
      error: null,
    });

    const result = await cancelSession(db as never, ORG_ID, SESSION_ID);

    expect(result.notes).toBe("Initial note - Cancelled");
  });

  it("throws NotFoundError when session not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(cancelSession(db as never, ORG_ID, "x")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws NotFoundError on session DB error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: { message: "not found" },
    });

    await expect(
      cancelSession(db as never, ORG_ID, SESSION_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when session is already completed", async () => {
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, notes: null, status: "completed" },
      error: null,
    });

    await expect(
      cancelSession(db as never, ORG_ID, SESSION_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when session is already cancelled", async () => {
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, notes: null, status: "cancelled" },
      error: null,
    });

    await expect(
      cancelSession(db as never, ORG_ID, SESSION_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("throws on update error", async () => {
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, notes: null, status: "in_progress" },
      error: null,
    });

    db.__qb.resolveOnce({
      data: null,
      error: { message: "update fail" },
    });

    await expect(
      cancelSession(db as never, ORG_ID, SESSION_ID),
    ).rejects.toThrow("update fail");
  });

  it("throws when update returns no data", async () => {
    db.__qb.resolveOnce({
      data: { id: SESSION_ID, notes: null, status: "in_progress" },
      error: null,
    });

    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      cancelSession(db as never, ORG_ID, SESSION_ID),
    ).rejects.toThrow("Failed to cancel session");
  });

  it("calls reportServerError on failure", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      cancelSession(db as never, ORG_ID, SESSION_ID),
    ).rejects.toThrow();
    expect(mockReportServerError).toHaveBeenCalledWith(
      "stockCount.cancelSession",
      expect.any(Error),
    );
  });
});
