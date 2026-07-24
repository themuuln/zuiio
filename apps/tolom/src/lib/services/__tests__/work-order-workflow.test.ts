import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Module-level mocks ────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    workOrders: (orgId: string) => `work-orders:${orgId}`,
    workOrder: (id: string) => `work-order:${id}`,
    workOrderDetail: (id: string) => `work-order-detail:${id}`,
    dailyWorkOrders: (orgId: string, date: string) =>
      `daily-work-orders:${orgId}:${date}`,
    dashboardMetrics: (orgId: string) => `dashboard:${orgId}:all`,
    reports: (orgId: string) => `reports:${orgId}`,
    inventoryMovements: (orgId: string) => `inventory-movements:${orgId}`,
    inventoryBalances: (orgId: string) => `inventory-balances:${orgId}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
}));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
}));
vi.mock("@/lib/services/service-reminder-service", () => ({
  syncWorkOrderToSchedules: vi.fn().mockResolvedValue(0),
}));
vi.mock("@/lib/services/push-triggers", () => ({
  notifyWorkOrderAssigned: vi.fn().mockResolvedValue(undefined),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { reportServerError } from "@/lib/sentry-report-server";
import { notifyWorkOrderAssigned } from "@/lib/services/push-triggers";
import { syncWorkOrderToSchedules } from "@/lib/services/service-reminder-service";
import { resolveBranchId } from "@/lib/supabase/with-branch";

const mockRevalidateTag = vi.mocked(revalidateTag);
const _mockLogAudit = vi.mocked(logAuditAfter);
const _mockReportServerError = vi.mocked(reportServerError);
const mockSyncWorkOrderToSchedules = vi.mocked(syncWorkOrderToSchedules);
const mockNotifyWorkOrderAssigned = vi.mocked(notifyWorkOrderAssigned);
const _mockResolveBranchId = vi.mocked(resolveBranchId);

import { assignMechanic, updateWorkOrderStatus } from "../work-order-workflow";

const ORG_ID = "org-1";
const WO_ID = "wo-1";
const USER_ID = "test-user-id";
const MECHANIC_ID = "mech-1";

let db: ReturnType<typeof createMockSupabaseClient>;

function makeWorkOrderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: WO_ID,
    organization_id: ORG_ID,
    status: "New",
    mechanic_id: null,
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    complaint: "Engine noise",
    description: null,
    bay_number: null,
    notes: null,
    odometer_at_service: null,
    discount_amount: null,
    discount_percentage: null,
    discount_total: null,
    subtotal: null,
    total: null,
    queue_order: null,
    completed_at: null,
    started_at: null,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
    created_by: USER_ID,
    updated_by: USER_ID,
    branch_id: null,
    diagnosis_label_id: null,
    loss_reason: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── updateWorkOrderStatus ──────────────────────────────────────

describe("updateWorkOrderStatus", () => {
  it("throws NotFoundError when work order is not found", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "not found" } });

    await expect(
      updateWorkOrderStatus(db, WO_ID, ORG_ID, "Diagnosing"),
    ).rejects.toThrow("Work order not found");
  });

  it("updates status and records history when status changes", async () => {
    const previousStatus = "New";
    const newStatus = "Diagnosing";
    const updatedRow = makeWorkOrderRow({ status: newStatus });

    const currentWO = {
      id: WO_ID,
      organization_id: ORG_ID,
      status: previousStatus,
      started_at: null,
    };
    db.__qb.resolveOnce({ data: currentWO, error: null });
    db.__qb.resolveOnce({ data: updatedRow, error: null });

    const result = await updateWorkOrderStatus(db, WO_ID, ORG_ID, newStatus);

    // Status history was inserted
    expect(db.from).toHaveBeenCalledWith("work_order_status_history");
    // Returned the updated row
    expect(result.status).toBe(newStatus);
    expect(result.id).toBe(WO_ID);
    // Revalidated cache tags
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `work-orders:${ORG_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `work-order:${WO_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `work-order-detail:${WO_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `dashboard:${ORG_ID}:all`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`reports:${ORG_ID}`, "max");
  });

  it("does not record history when status is unchanged", async () => {
    const currentStatus = "New";
    const updatedRow = makeWorkOrderRow({ status: currentStatus });

    const currentWO = {
      id: WO_ID,
      organization_id: ORG_ID,
      status: currentStatus,
      started_at: null,
    };
    db.__qb.resolveOnce({ data: currentWO, error: null });
    db.__qb.resolveOnce({ data: updatedRow, error: null });

    await updateWorkOrderStatus(db, WO_ID, ORG_ID, currentStatus);

    // Should NOT have inserted status history
    const fromCalls = (db.from as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: string[]) => c[0],
    );
    expect(fromCalls).not.toContain("work_order_status_history");
  });

  it("sets started_at when moving to In Progress without one", async () => {
    const newStatus = "In Progress";
    const updatedRow = makeWorkOrderRow({
      status: newStatus,
      started_at: null,
    });

    const currentWO = {
      id: WO_ID,
      organization_id: ORG_ID,
      status: "Diagnosing",
      started_at: null,
    };
    db.__qb.resolveOnce({ data: currentWO, error: null });
    db.__qb.resolveOnce({ data: updatedRow, error: null });

    await updateWorkOrderStatus(db, WO_ID, ORG_ID, newStatus);

    // Should have set started_at — 3rd work_orders call
    const fromCalls = (db.from as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: string[]) => c[0],
    );
    const workOrderCalls = fromCalls.filter((t: string) => t === "work_orders");
    expect(workOrderCalls.length).toBeGreaterThanOrEqual(3);
  });

  it("does not set started_at when work order already has one", async () => {
    const newStatus = "In Progress";
    const startedAt = "2025-01-15T10:30:00Z";
    const updatedRow = makeWorkOrderRow({
      status: newStatus,
      started_at: startedAt,
    });

    const currentWO = {
      id: WO_ID,
      organization_id: ORG_ID,
      status: "Diagnosing",
      started_at: startedAt,
    };
    db.__qb.resolveOnce({ data: currentWO, error: null });
    db.__qb.resolveOnce({ data: updatedRow, error: null });

    await updateWorkOrderStatus(db, WO_ID, ORG_ID, newStatus);

    // Only 2 work_orders calls: initial fetch + update+select
    const fromCalls = (db.from as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: string[]) => c[0],
    );
    const workOrderCalls = fromCalls.filter((t: string) => t === "work_orders");
    expect(workOrderCalls.length).toBe(2);
  });

  it("handles Completed flow: sets completed_at, syncs schedules, deducts inventory", async () => {
    const newStatus = "Completed";
    const updatedRow = makeWorkOrderRow({
      status: newStatus,
      completed_at: "2025-01-15T11:00:00Z",
    });

    const currentWO = {
      id: WO_ID,
      organization_id: ORG_ID,
      status: "In Progress",
      started_at: "2025-01-15T10:00:00Z",
    };
    db.__qb.resolveOnce({ data: currentWO, error: null });
    db.__qb.resolveOnce({ data: updatedRow, error: null });
    // insertStatusHistory (work_order_status_history) — default ok
    db.__qb.resolveOnce({ data: null, error: null });
    // completed_at update — default ok
    db.__qb.resolveOnce({ data: null, error: null });
    // work_order_parts query
    db.__qb.resolveOnce({
      data: [
        { part_id: "p1", quantity: 2, unit_price: 5000 },
        { part_id: "p2", quantity: 1, unit_price: 12000 },
      ],
      error: null,
    });
    // inventory_balances query
    db.__qb.resolveOnce({
      data: [
        { part_id: "p1", quantity: 10 },
        { part_id: "p2", quantity: 5 },
      ],
      error: null,
    });

    await updateWorkOrderStatus(db, WO_ID, ORG_ID, newStatus);

    // Status history was recorded
    expect(db.from).toHaveBeenCalledWith("work_order_status_history");
    // Schedule sync was triggered (fire-and-forget)
    expect(mockSyncWorkOrderToSchedules).toHaveBeenCalledWith(db, WO_ID);
    // Inventory movements were created
    expect(db.from).toHaveBeenCalledWith("inventory_movements");
    // Inventory-specific cache tags revalidated
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `inventory-movements:${ORG_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `inventory-balances:${ORG_ID}`,
      "max",
    );
    // Base cache tags revalidated
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `dashboard:${ORG_ID}:all`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`reports:${ORG_ID}`, "max");
  });

  it("warns when deducting more than available stock", async () => {
    const newStatus = "Completed";
    const updatedRow = makeWorkOrderRow({
      status: newStatus,
      completed_at: "2025-01-15T11:00:00Z",
    });

    const currentWO = {
      id: WO_ID,
      organization_id: ORG_ID,
      status: "In Progress",
      started_at: "2025-01-15T10:00:00Z",
    };
    db.__qb.resolveOnce({ data: currentWO, error: null });
    db.__qb.resolveOnce({ data: updatedRow, error: null });
    // insertStatusHistory — default ok
    db.__qb.resolveOnce({ data: null, error: null });
    // completed_at update — default ok
    db.__qb.resolveOnce({ data: null, error: null });
    // Only 1 part with insufficient stock — quantity 10 but available 3
    db.__qb.resolveOnce({
      data: [{ part_id: "p1", quantity: 10, unit_price: 5000 }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ part_id: "p1", quantity: 3 }],
      error: null,
    });

    await updateWorkOrderStatus(db, WO_ID, ORG_ID, newStatus);

    // Inventory movements still created despite low stock
    expect(db.from).toHaveBeenCalledWith("inventory_movements");
    // Warning logged
    expect(logger.warn).toHaveBeenCalled();
    const warnCall = (logger.warn as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(warnCall[1]).toContain("only 3 available");
  });

  it("handles Completed with no parts gracefully", async () => {
    const newStatus = "Completed";
    const updatedRow = makeWorkOrderRow({
      status: newStatus,
      completed_at: "2025-01-15T11:00:00Z",
    });

    const currentWO = {
      id: WO_ID,
      organization_id: ORG_ID,
      status: "In Progress",
      started_at: "2025-01-15T10:00:00Z",
    };
    db.__qb.resolveOnce({ data: currentWO, error: null });
    db.__qb.resolveOnce({ data: updatedRow, error: null });
    // insertStatusHistory — default ok
    db.__qb.resolveOnce({ data: null, error: null });
    // completed_at update — default ok
    db.__qb.resolveOnce({ data: null, error: null });
    // No parts
    db.__qb.resolveOnce({ data: [], error: null });

    await updateWorkOrderStatus(db, WO_ID, ORG_ID, newStatus);

    // Schedule sync was still triggered
    expect(mockSyncWorkOrderToSchedules).toHaveBeenCalledWith(db, WO_ID);
    // No inventory movements created
    expect(db.from).not.toHaveBeenCalledWith("inventory_movements");
    // Still revalidated inventory cache tags
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `inventory-movements:${ORG_ID}`,
      "max",
    );
  });

  it("includes loss_reason when completing with loss", async () => {
    const newStatus = "Completed";
    const lossReason = "Customer dispute";
    const updatedRow = makeWorkOrderRow({
      status: newStatus,
      loss_reason: lossReason,
    });

    const currentWO = {
      id: WO_ID,
      organization_id: ORG_ID,
      status: "In Progress",
      started_at: "2025-01-15T10:00:00Z",
    };
    db.__qb.resolveOnce({ data: currentWO, error: null });
    db.__qb.resolveOnce({ data: updatedRow, error: null });
    // insertStatusHistory — default ok
    db.__qb.resolveOnce({ data: null, error: null });
    // completed_at update — default ok
    db.__qb.resolveOnce({ data: null, error: null });
    // No parts — skip inventory for this test
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await updateWorkOrderStatus(
      db,
      WO_ID,
      ORG_ID,
      newStatus,
      /* notes */ undefined,
      lossReason,
    );

    // Schedule sync was triggered
    expect(mockSyncWorkOrderToSchedules).toHaveBeenCalled();

    // Status history was recorded
    expect(db.from).toHaveBeenCalledWith("work_order_status_history");

    // Returned the Completed work order
    expect(result.status).toBe("Completed");
    expect(result.loss_reason).toBe(lossReason);

    // Inventory cache tags were revalidated (Completed path)
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `inventory-balances:${ORG_ID}`,
      "max",
    );
  });
});

// ── assignMechanic ─────────────────────────────────────────────

describe("assignMechanic", () => {
  it("inserts assignment, updates work order, and notifies mechanic", async () => {
    const assignmentData = {
      id: "assn-1",
      work_order_id: WO_ID,
      organization_id: ORG_ID,
      mechanic_id: MECHANIC_ID,
      assigned_by: USER_ID,
      assigned_at: "2025-01-15T10:00:00Z",
    };
    // First await: unassigned_at update (fire-and-forget, not checked)
    db.__qb.resolveOnce({ data: null, error: null });
    // Second await: insert + select result
    db.__qb.resolveOnce({ data: assignmentData, error: null });

    const result = await assignMechanic(db, WO_ID, ORG_ID, MECHANIC_ID);

    // Previous assignment was unset
    expect(db.from).toHaveBeenCalledWith("mechanic_assignments");
    // Work order mechanic_id was updated
    expect(db.from).toHaveBeenCalledWith("work_orders");
    // Notification sent (fire-and-forget)
    expect(mockNotifyWorkOrderAssigned).toHaveBeenCalledWith(db, {
      mechanicId: MECHANIC_ID,
      workOrderNumber: WO_ID.slice(0, 8),
      bayNumber: null,
    });
    // Cache revalidated
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `work-order:${WO_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `work-order-detail:${WO_ID}`,
      "max",
    );
    // Returns the assignment
    expect(result.id).toBe("assn-1");
    expect(result.mechanic_id).toBe(MECHANIC_ID);
  });

  it("throws error when insert fails", async () => {
    // First await: unassigned_at update (fire-and-forget, not checked)
    db.__qb.resolveOnce({ data: null, error: null });
    // Second await: insert + select result with error
    db.__qb.resolveOnce({
      data: null,
      error: { message: "duplicate key violation" },
    });

    await expect(
      assignMechanic(db, WO_ID, ORG_ID, MECHANIC_ID),
    ).rejects.toThrow("duplicate key violation");
  });
});
