import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { reportServerError } from "@/lib/sentry-report-server";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockReportServerError = vi.mocked(reportServerError);

import {
  approveTransfer,
  cancelTransfer,
  createTransfer,
  getTransfer,
  getTransfers,
  markInTransit,
  receiveTransfer,
} from "../transfer-service";

const ORG_ID = "org-1";
const TRANSFER_ID = "trans-1";
const USER_ID = "user-1";
const BRANCH_ID = "branch-1";
const DEST_BRANCH_ID = "branch-2";
const PART_ID = "part-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

function makeTransferRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TRANSFER_ID,
    organization_id: ORG_ID,
    from_branch_id: BRANCH_ID,
    to_branch_id: DEST_BRANCH_ID,
    status: "pending",
    notes: null,
    created_by: USER_ID,
    approved_by: null,
    received_by: null,
    cancelled_at: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    from_branch: { name: "Warehouse A" },
    to_branch: { name: "Store B" },
    creator: { full_name: "John Doe" },
    items: [
      {
        id: "item-1",
        transfer_id: TRANSFER_ID,
        part_id: PART_ID,
        quantity: 5,
        unit_cost: 10,
        part: { name: "Brake Pad", part_number: "BP-001", unit: "pcs" },
      },
    ],
    ...overrides,
  };
}

function makeItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    transfer_id: TRANSFER_ID,
    part_id: PART_ID,
    quantity: 5,
    unit_cost: 10,
    part: { name: "Brake Pad", part_number: "BP-001", unit: "pcs" },
    ...overrides,
  };
}

const createParams = {
  to_branch_id: DEST_BRANCH_ID,
  from_branch_id: BRANCH_ID,
  notes: "  Test transfer  ",
  items: [{ part_id: PART_ID, quantity: 5, unit_cost: 10 }],
};

// ── getTransfers ────────────────────────────────────────────────

describe("getTransfers", () => {
  it("should return paginated list of transfers with joined names", async () => {
    const row = makeTransferRow();
    db.__qb.resolveWith({ data: [row], error: null, count: 1 });

    const result = await getTransfers(db, ORG_ID);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(TRANSFER_ID);
    expect(result.data[0].from_branch_name).toBe("Warehouse A");
    expect(result.data[0].to_branch_name).toBe("Store B");
    expect(result.data[0].created_by_name).toBe("John Doe");
    expect(result.data[0].from_branch).toBeUndefined();
    expect(result.data[0].to_branch).toBeUndefined();
    expect(result.data[0].creator).toBeUndefined();
    expect(result.data[0].items).toBeUndefined();
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.totalPages).toBe(1);
  });

  it("should use default pagination when no options given", async () => {
    db.__qb.resolveWith({ data: [], error: null, count: 0 });

    await getTransfers(db, ORG_ID);

    expect(db.from("stock_transfers").select).toHaveBeenCalledWith(
      expect.any(String),
      { count: "exact" },
    );
    expect(db.from("stock_transfers").order).toHaveBeenCalledWith(
      "created_at",
      {
        ascending: false,
      },
    );
    expect(db.from("stock_transfers").range).toHaveBeenCalledWith(0, 19);
  });

  it("should filter by status", async () => {
    db.__qb.resolveWith({ data: [], error: null, count: 0 });

    await getTransfers(db, ORG_ID, { status: "pending" });

    const eqCalls = db.from("stock_transfers").eq.mock.calls;
    const statusEq = eqCalls.find((c: string[]) => c[0] === "status");
    expect(statusEq).toBeDefined();
    expect(statusEq?.[1]).toBe("pending");
  });

  it("should skip status filter when status is 'all'", async () => {
    db.__qb.resolveWith({ data: [], error: null, count: 0 });

    await getTransfers(db, ORG_ID, { status: "all" });

    const eqCalls = db.from("stock_transfers").eq.mock.calls;
    const statusEq = eqCalls.find((c: string[]) => c[0] === "status");
    expect(statusEq).toBeUndefined();
  });

  it("should filter by branch via or query", async () => {
    db.__qb.resolveWith({ data: [], error: null, count: 0 });

    await getTransfers(db, ORG_ID, { branchId: BRANCH_ID });

    expect(db.from("stock_transfers").or).toHaveBeenCalledWith(
      `from_branch_id.eq.${BRANCH_ID},to_branch_id.eq.${BRANCH_ID}`,
    );
  });

  it("should apply custom page and pageSize", async () => {
    db.__qb.resolveWith({ data: [], error: null, count: 0 });

    const result = await getTransfers(db, ORG_ID, { page: 3, pageSize: 10 });

    expect(db.from("stock_transfers").range).toHaveBeenCalledWith(20, 29);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
  });

  it("should clamp page and pageSize to valid ranges", async () => {
    db.__qb.resolveWith({ data: [], error: null, count: 0 });

    const result = await getTransfers(db, ORG_ID, { page: 0, pageSize: 200 });

    expect(db.from("stock_transfers").range).toHaveBeenCalledWith(0, 99);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(100);
  });

  it("should handle empty results", async () => {
    db.__qb.resolveWith({ data: [], error: null, count: 0 });

    const result = await getTransfers(db, ORG_ID);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("should throw on query error", async () => {
    db.__qb.resolveWith({
      data: null,
      error: { message: "DB connection failed" },
    });

    await expect(getTransfers(db, ORG_ID)).rejects.toThrow(
      "DB connection failed",
    );
  });

  it("should map nested objects to flat field names", async () => {
    const row = makeTransferRow({
      from_branch: null,
      to_branch: { name: "Destination" },
      creator: null,
    });
    db.__qb.resolveWith({ data: [row], error: null, count: 1 });

    const result = await getTransfers(db, ORG_ID);

    expect(result.data[0].from_branch_name).toBeNull();
    expect(result.data[0].to_branch_name).toBe("Destination");
    expect(result.data[0].created_by_name).toBeNull();
  });

  it("should compute item_count from items array length", async () => {
    // getTransfers uses the count subquery — items arrives as [{ count: "2" }]
    const row = makeTransferRow({ items: [{ count: "2" }] });
    db.__qb.resolveWith({ data: [row], error: null, count: 1 });

    const result = await getTransfers(db, ORG_ID);

    expect(result.data[0].item_count).toBe(1);
  });

  it("should default item_count to 0 when items is not an array", async () => {
    const row = makeTransferRow({ items: null });
    db.__qb.resolveWith({ data: [row], error: null, count: 1 });

    const result = await getTransfers(db, ORG_ID);

    expect(result.data[0].item_count).toBe(0);
  });
});

// ── getTransfer ──────────────────────────────────────────────────

describe("getTransfer", () => {
  it("should return single transfer with items and part details", async () => {
    const item = makeItemRow();
    const row = makeTransferRow({ items: [item] });
    db.__qb.resolveOnce({ data: row, error: null });

    const result = await getTransfer(db, TRANSFER_ID, ORG_ID);

    expect(result.id).toBe(TRANSFER_ID);
    expect(result.from_branch_name).toBe("Warehouse A");
    expect(result.to_branch_name).toBe("Store B");
    expect(result.created_by_name).toBe("John Doe");
    expect(result.items?.[0].part_name).toBe("Brake Pad");
    expect(result.items?.[0].part_number).toBe("BP-001");
    expect(result.items?.[0].unit).toBe("pcs");
    expect(
      (result.items?.[0] as unknown as { part: unknown }).part,
    ).toBeUndefined();
    expect(
      (result as unknown as { from_branch: unknown }).from_branch,
    ).toBeUndefined();
    expect(
      (result as unknown as { to_branch: unknown }).to_branch,
    ).toBeUndefined();
    expect((result as unknown as { creator: unknown }).creator).toBeUndefined();
  });

  it("should throw NotFoundError when transfer not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(getTransfer(db, TRANSFER_ID, ORG_ID)).rejects.toThrow(
      "Transfer not found",
    );
  });

  it("should throw NotFoundError on query error", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "not found" } });

    await expect(getTransfer(db, TRANSFER_ID, ORG_ID)).rejects.toThrow(
      "Transfer not found",
    );
  });

  it("should default to_branch_name to 'Unknown' when branch join is null", async () => {
    const row = makeTransferRow({
      to_branch: null,
      from_branch: null,
      creator: null,
      items: [],
    });
    db.__qb.resolveOnce({ data: row, error: null });

    const result = await getTransfer(db, TRANSFER_ID, ORG_ID);

    expect(result.to_branch_name).toBe("Unknown");
    expect(result.from_branch_name).toBeNull();
    expect(result.created_by_name).toBeNull();
  });

  it("should map item part details with fallback defaults", async () => {
    const item = makeItemRow({
      part: { name: null, part_number: null, unit: null },
    });
    const row = makeTransferRow({ items: [item] });
    db.__qb.resolveOnce({ data: row, error: null });

    const result = await getTransfer(db, TRANSFER_ID, ORG_ID);

    expect(result.items?.[0].part_name).toBe("Unknown");
    expect(result.items?.[0].part_number).toBeNull();
    expect(result.items?.[0].unit).toBe("pcs");
  });
});

// ── createTransfer ───────────────────────────────────────────────

describe("createTransfer", () => {
  it("should create transfer with items and return full record", async () => {
    const row = makeTransferRow();

    db.__qb.resolveOnce({ data: { id: TRANSFER_ID }, error: null }); // insert transfer
    db.__qb.resolveOnce({ data: null, error: null }); // insert items
    db.__qb.resolveOnce({ data: row, error: null }); // getTransfer (internal)

    const result = await createTransfer(db, ORG_ID, createParams, USER_ID);

    expect(result.id).toBe(TRANSFER_ID);

    // All insert calls share the same qb mock
    const insertCalls = db.from("stock_transfers").insert.mock.calls;
    // First insert = transfer row
    expect(insertCalls[0][0]).toMatchObject({
      organization_id: ORG_ID,
      from_branch_id: BRANCH_ID,
      to_branch_id: DEST_BRANCH_ID,
      status: "pending",
      notes: "Test transfer",
      created_by: USER_ID,
    });
    // Second insert = items array
    expect(insertCalls[1][0]).toEqual([
      {
        transfer_id: TRANSFER_ID,
        part_id: PART_ID,
        quantity: 5,
        unit_cost: 10,
      },
    ]);

    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("should throw ValidationError when to_branch_id is missing", async () => {
    await expect(
      createTransfer(
        db,
        ORG_ID,
        { ...createParams, to_branch_id: "" },
        USER_ID,
      ),
    ).rejects.toThrow("Destination branch is required");
  });

  it("should throw ValidationError when items array is empty", async () => {
    await expect(
      createTransfer(db, ORG_ID, { ...createParams, items: [] }, USER_ID),
    ).rejects.toThrow("At least one item is required");
  });

  it("should throw ValidationError when item has no part_id", async () => {
    await expect(
      createTransfer(
        db,
        ORG_ID,
        {
          ...createParams,
          items: [{ part_id: "", quantity: 5, unit_cost: 10 }],
        },
        USER_ID,
      ),
    ).rejects.toThrow("Part is required for each item");
  });

  it("should throw ValidationError when item quantity is zero", async () => {
    await expect(
      createTransfer(
        db,
        ORG_ID,
        {
          ...createParams,
          items: [{ part_id: PART_ID, quantity: 0, unit_cost: 10 }],
        },
        USER_ID,
      ),
    ).rejects.toThrow("Quantity must be positive");
  });

  it("should throw ValidationError when item quantity is negative", async () => {
    await expect(
      createTransfer(
        db,
        ORG_ID,
        {
          ...createParams,
          items: [{ part_id: PART_ID, quantity: -1, unit_cost: 10 }],
        },
        USER_ID,
      ),
    ).rejects.toThrow("Quantity must be positive");
  });

  it("should throw when transfer insert fails", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "Insert failed" } });

    await expect(
      createTransfer(db, ORG_ID, createParams, USER_ID),
    ).rejects.toThrow("Insert failed");
  });

  it("should rollback transfer and throw when items insert fails", async () => {
    db.__qb.resolveOnce({ data: { id: TRANSFER_ID }, error: null }); // insert transfer succeeds
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Item insert failed" },
    }); // insert items fails
    db.__qb.resolveOnce({ data: null, error: null }); // rollback delete

    await expect(
      createTransfer(db, ORG_ID, createParams, USER_ID),
    ).rejects.toThrow("Item insert failed");

    // Verify rollback
    expect(db.from("stock_transfers").delete).toHaveBeenCalled();
    expect(db.from("stock_transfers").delete().eq).toHaveBeenCalledWith(
      "id",
      TRANSFER_ID,
    );
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Failed to add transfer items, rolled back transfer",
      expect.objectContaining({ message: "Item insert failed" }),
    );
    // Should NOT revalidate on rollback
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("should handle notes with whitespace trimming", async () => {
    db.__qb.resolveOnce({ data: { id: TRANSFER_ID }, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: makeTransferRow(), error: null });

    await createTransfer(
      db,
      ORG_ID,
      { ...createParams, notes: "   Spaced notes   " },
      USER_ID,
    );

    const insertCalls = db.from("stock_transfers").insert.mock.calls;
    expect(insertCalls[0][0].notes).toBe("Spaced notes");
  });
});

// ── approveTransfer ─────────────────────────────────────────────

describe("approveTransfer", () => {
  it("should approve a pending transfer", async () => {
    const row = makeTransferRow({
      status: "pending",
      from_branch_id: BRANCH_ID,
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch transfer
    db.__qb.resolveOnce({ data: { quantity_on_hand: 10 }, error: null }); // inventory check
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: row, error: null }); // getTransfer

    const result = await approveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    expect(result.id).toBe(TRANSFER_ID);

    expect(db.from("stock_transfers").update).toHaveBeenCalledWith({
      status: "approved",
      approved_by: USER_ID,
    });
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "stock_transfers",
        record_id: TRANSFER_ID,
        user_id: USER_ID,
        organization_id: ORG_ID,
        new_data: { status: "approved" },
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("should approve transfer without from_branch_id (skip stock check)", async () => {
    const row = makeTransferRow({
      status: "pending",
      from_branch_id: null,
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: row, error: null }); // getTransfer

    await approveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    // Should NOT query inventory_balances
    const fromCalls = db.from.mock.calls as Array<string[]>;
    const inventoryCall = fromCalls.find((c) => c[0] === "inventory_balances");
    expect(inventoryCall).toBeUndefined();
    expect(db.from("stock_transfers").update).toHaveBeenCalled();
  });

  it("should throw NotFoundError when transfer does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      approveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Transfer not found");
  });

  it("should throw ValidationError when transfer is not pending", async () => {
    const row = makeTransferRow({ status: "approved" });
    db.__qb.resolveOnce({ data: row, error: null });

    await expect(
      approveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Only pending transfers can be approved");
  });

  it("should throw ValidationError when stock is insufficient", async () => {
    const row = makeTransferRow({
      status: "pending",
      from_branch_id: BRANCH_ID,
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch
    db.__qb.resolveOnce({ data: { quantity_on_hand: 2 }, error: null }); // only 2, need 5

    await expect(
      approveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Insufficient stock: need 5, have 2 at source branch");
  });

  it("should treat null inventory_balance as 0 (insufficient)", async () => {
    const row = makeTransferRow({
      status: "pending",
      from_branch_id: BRANCH_ID,
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // no balance row exists

    await expect(
      approveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Insufficient stock: need 5, have 0 at source branch");
  });

  it("should check stock for each item", async () => {
    const row = makeTransferRow({
      status: "pending",
      from_branch_id: BRANCH_ID,
      items: [
        { part_id: "part-1", quantity: 5 },
        { part_id: "part-2", quantity: 3 },
      ],
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch
    db.__qb.resolveOnce({ data: { quantity_on_hand: 10 }, error: null }); // part-1 OK
    db.__qb.resolveOnce({ data: { quantity_on_hand: 5 }, error: null }); // part-2 OK
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: row, error: null }); // getTransfer

    await approveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    expect(db.from("stock_transfers").update).toHaveBeenCalled();
  });
});

// ── markInTransit ───────────────────────────────────────────────

describe("markInTransit", () => {
  it("should mark approved transfer as in_transit", async () => {
    db.__qb.resolveOnce({
      data: { id: TRANSFER_ID, status: "approved" },
      error: null,
    }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({
      data: makeTransferRow({ status: "approved" }),
      error: null,
    }); // getTransfer

    const result = await markInTransit(db, TRANSFER_ID, ORG_ID, USER_ID);

    expect(result.id).toBe(TRANSFER_ID);
    expect(db.from("stock_transfers").update).toHaveBeenCalledWith({
      status: "in_transit",
    });
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ new_data: { status: "in_transit" } }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("should throw NotFoundError when transfer not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      markInTransit(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Transfer not found");
  });

  it("should throw ValidationError when transfer is not approved", async () => {
    db.__qb.resolveOnce({
      data: { id: TRANSFER_ID, status: "pending" },
      error: null,
    });

    await expect(
      markInTransit(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Only approved transfers can be marked in transit");
  });
});

// ── receiveTransfer ─────────────────────────────────────────────

describe("receiveTransfer", () => {
  it("should create movements and complete a transfer", async () => {
    const row = makeTransferRow({
      status: "approved",
      from_branch_id: BRANCH_ID,
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // transfer_out movement
    db.__qb.resolveOnce({ data: null, error: null }); // transfer_in movement
    db.__qb.resolveOnce({ data: null, error: null }); // update status
    db.__qb.resolveOnce({ data: row, error: null }); // getTransfer

    const result = await receiveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    expect(result.id).toBe(TRANSFER_ID);

    // Verify movement creation
    const mvInserts = db.from("inventory_movements").insert.mock.calls;
    expect(mvInserts[0][0]).toMatchObject({
      branch_id: BRANCH_ID,
      movement_type: "transfer_out",
      quantity: -5,
      reference_type: "stock_transfer",
      reference_id: TRANSFER_ID,
    });
    expect(mvInserts[1][0]).toMatchObject({
      branch_id: DEST_BRANCH_ID,
      movement_type: "transfer_in",
      quantity: 5,
      reference_type: "stock_transfer",
      reference_id: TRANSFER_ID,
    });

    expect(db.from("stock_transfers").update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        received_by: USER_ID,
      }),
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ new_data: { status: "completed" } }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
  });

  it("should receive transfer without from_branch_id (no source movements)", async () => {
    const row = makeTransferRow({
      status: "in_transit",
      from_branch_id: null,
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // transfer_in (only)
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: row, error: null }); // getTransfer

    await receiveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    const mvInserts = db.from("inventory_movements").insert.mock.calls;
    expect(mvInserts).toHaveLength(1);
    expect(mvInserts[0][0]).toMatchObject({ movement_type: "transfer_in" });
  });

  it("should create movements for each item", async () => {
    const row = makeTransferRow({
      status: "approved",
      from_branch_id: BRANCH_ID,
      items: [
        { id: "i1", part_id: "part-1", quantity: 3, unit_cost: 10 },
        { id: "i2", part_id: "part-2", quantity: 7, unit_cost: 15 },
      ],
    });

    // fetch + 2 transfer_out + 2 transfer_in + update + getTransfer = 7 awaits
    db.__qb.resolveOnce({ data: row, error: null });
    db.__qb.resolveOnce({ data: null, error: null }); // out item 0
    db.__qb.resolveOnce({ data: null, error: null }); // out item 1
    db.__qb.resolveOnce({ data: null, error: null }); // in item 0
    db.__qb.resolveOnce({ data: null, error: null }); // in item 1
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({ data: row, error: null }); // getTransfer

    await receiveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    const mvInserts = db.from("inventory_movements").insert.mock.calls;
    expect(mvInserts).toHaveLength(4);
    expect(mvInserts[0][0].quantity).toBe(-3);
    expect(mvInserts[1][0].quantity).toBe(-7);
    expect(mvInserts[2][0].quantity).toBe(3);
    expect(mvInserts[3][0].quantity).toBe(7);
  });

  it("should throw NotFoundError when transfer not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      receiveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Transfer not found");
  });

  it("should throw ValidationError when status is pending", async () => {
    const row = makeTransferRow({ status: "pending" });
    db.__qb.resolveOnce({ data: row, error: null });

    await expect(
      receiveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Only approved or in-transit transfers can be received");
  });

  it("should throw Error when transfer_out movement fails", async () => {
    const row = makeTransferRow({
      status: "approved",
      from_branch_id: BRANCH_ID,
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch
    db.__qb.resolveOnce({
      data: null,
      error: { message: "FK constraint" },
    }); // transfer_out fails

    await expect(
      receiveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Inventory movement failed: FK constraint");

    expect(mockReportServerError).toHaveBeenCalled();
    // Only 1 insert call (transfer_out) — transfer_in was never reached
    expect(db.from("inventory_movements").insert).toHaveBeenCalledTimes(1);
  });

  it("should throw Error when transfer_in movement fails", async () => {
    const row = makeTransferRow({
      status: "in_transit",
      from_branch_id: BRANCH_ID,
    });

    db.__qb.resolveOnce({ data: row, error: null }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // transfer_out OK
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Insert failed" },
    }); // transfer_in fails

    await expect(
      receiveTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Inventory movement failed: Insert failed");

    expect(mockReportServerError).toHaveBeenCalled();
  });
});

// ── cancelTransfer ──────────────────────────────────────────────

describe("cancelTransfer", () => {
  it("should cancel a pending transfer", async () => {
    db.__qb.resolveOnce({
      data: { id: TRANSFER_ID, status: "pending" },
      error: null,
    }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({
      data: makeTransferRow({ status: "cancelled" }),
      error: null,
    }); // getTransfer

    const result = await cancelTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    expect(result.id).toBe(TRANSFER_ID);
    expect(db.from("stock_transfers").update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ new_data: { status: "cancelled" } }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("should cancel an approved transfer", async () => {
    db.__qb.resolveOnce({
      data: { id: TRANSFER_ID, status: "approved" },
      error: null,
    }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({
      data: makeTransferRow({ status: "cancelled" }),
      error: null,
    }); // getTransfer

    await cancelTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    expect(db.from("stock_transfers").update).toHaveBeenCalled();
  });

  it("should cancel an in_transit transfer", async () => {
    db.__qb.resolveOnce({
      data: { id: TRANSFER_ID, status: "in_transit" },
      error: null,
    }); // fetch
    db.__qb.resolveOnce({ data: null, error: null }); // update
    db.__qb.resolveOnce({
      data: makeTransferRow({ status: "cancelled" }),
      error: null,
    }); // getTransfer

    await cancelTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    expect(db.from("stock_transfers").update).toHaveBeenCalled();
  });

  it("should throw NotFoundError when transfer not found", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      cancelTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Transfer not found");
  });

  it("should throw ValidationError when transfer is completed", async () => {
    db.__qb.resolveOnce({
      data: { id: TRANSFER_ID, status: "completed" },
      error: null,
    });

    await expect(
      cancelTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Cannot cancel a completed or cancelled transfer");
  });

  it("should throw ValidationError when transfer is already cancelled", async () => {
    db.__qb.resolveOnce({
      data: { id: TRANSFER_ID, status: "cancelled" },
      error: null,
    });

    await expect(
      cancelTransfer(db, TRANSFER_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Cannot cancel a completed or cancelled transfer");
  });

  it("should set cancelled_at timestamp", async () => {
    const before = Date.now();

    db.__qb.resolveOnce({
      data: { id: TRANSFER_ID, status: "pending" },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({
      data: makeTransferRow({ status: "cancelled" }),
      error: null,
    });

    await cancelTransfer(db, TRANSFER_ID, ORG_ID, USER_ID);

    const updateCall = db.from("stock_transfers").update.mock.calls[0];
    expect(updateCall[0].status).toBe("cancelled");
    expect(typeof updateCall[0].cancelled_at).toBe("string");
    expect(
      new Date(updateCall[0].cancelled_at).getTime(),
    ).toBeGreaterThanOrEqual(before);
  });
});
