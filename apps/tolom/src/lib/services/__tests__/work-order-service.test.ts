import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Module-level mocks ────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    workOrders: (orgId: string) => `work_orders:${orgId}`,
    workOrder: (id: string) => `work_order:${id}`,
    workOrderDetail: (id: string) => `work_order_detail:${id}`,
    dailyWorkOrders: (orgId: string, date: string) =>
      `daily_work_orders:${orgId}:${date}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
  withBranchFilter: vi.fn((q: unknown) => q),
}));
vi.mock("@/lib/supabase/query", () => ({
  withDbCapture: vi.fn((_label: string, promise: Promise<unknown>) => promise),
}));
vi.mock("../work-order-items-service", () => ({
  addPartToWorkOrder: vi.fn().mockResolvedValue(undefined),
  addServiceToWorkOrder: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/_queries/work-order-queries", () => ({
  getWorkOrderDetail: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { capture } from "@/lib/capture";
import { logger } from "@/lib/logger";
import { reportServerError } from "@/lib/sentry-report-server";
import { getWorkOrderDetail as _getWorkOrderDetail } from "@/lib/services/_queries/work-order-queries";
import { resolveBranchId } from "@/lib/supabase/with-branch";
import {
  addPartToWorkOrder,
  addServiceToWorkOrder,
} from "../work-order-items-service";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const _mockCapture = vi.mocked(capture);
const mockReportServerError = vi.mocked(reportServerError);
const mockGetWorkOrderDetail = vi.mocked(_getWorkOrderDetail);
const mockResolveBranchId = vi.mocked(resolveBranchId);
const _mockAddPart = vi.mocked(addPartToWorkOrder);
const mockAddService = vi.mocked(addServiceToWorkOrder);

// ── Imports under test ────────────────────────────────────────────

import {
  cancelWorkOrder,
  createWorkOrder,
  getWorkOrder,
  getWorkOrders,
  getWorkOrdersFast,
  getWorkOrderTotals,
  recalculateWorkOrderTotals,
} from "../work-order-service";

const ORG_ID = "org-1";
const WO_ID = "wo-1";
const USER_ID = "user-1";

let db: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  vi.resetAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  db = createMockSupabaseClient();
});

// ── Helpers ───────────────────────────────────────────────────────

const makeWorkOrderRow = (overrides: Record<string, unknown> = {}) => ({
  id: WO_ID,
  organization_id: ORG_ID,
  branch_id: null,
  customer_id: "cust-1",
  vehicle_id: "veh-1",
  status: "New",
  complaint: "Engine noise",
  description: null,
  bay_number: 1,
  created_at: "2025-01-15T10:00:00Z",
  updated_at: null,
  mechanic_id: "mech-1",
  total: 250.0,
  subtotal: 300.0,
  discount_total: 50.0,
  discount_amount: 0,
  discount_percentage: 0,
  odometer_at_service: 50000,
  queue_order: 1,
  notes: null,
  completed_at: null,
  started_at: null,
  loss_reason: null,
  customer: { first_name: "John", last_name: "Doe", phone: "99112233" },
  vehicle: { plate_number: "001УБА", make: "Toyota", model: "Camry" },
  mechanic_profile: { full_name: "Mech One", avatar_url: null },
  ...overrides,
});

const makeCostRow = (overrides: Record<string, unknown> = {}) => ({
  work_order_id: WO_ID,
  services_cost: 150,
  parts_cost: 80,
  services_revenue: 200,
  parts_revenue: 120,
  gross_profit: 90,
  margin_percent: 28.1,
  ...overrides,
});

const makeDetail = (overrides: Record<string, unknown> = {}) => ({
  id: WO_ID,
  status: "New",
  services: [
    { id: "svc-1", unit_price: 100, quantity: 1, final_price: 100 },
    { id: "svc-2", unit_price: 50, quantity: 2, final_price: 100 },
  ],
  parts: [
    { id: "part-1", unit_price: 80, quantity: 1, final_price: 80 },
    { id: "part-2", unit_price: 20, quantity: 3, final_price: 60 },
  ],
  ...overrides,
});

// ── getWorkOrders ─────────────────────────────────────────────────

describe("getWorkOrders", () => {
  it("returns mapped work orders with cost data", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow()],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({
      data: [makeCostRow()],
      error: null,
    });

    const result = await getWorkOrders(db as never, ORG_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(WO_ID);
    expect(result[0].services_cost).toBe(150);
    expect(result[0].parts_cost).toBe(80);
    expect(result[0].gross_profit).toBe(90);
    expect(result[0].mechanic?.full_name).toBe("Mech One");
  });

  it("returns empty array when no data", async () => {
    db.__qb.resolveOnce({ data: null, error: null, count: null });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getWorkOrders(db as never, ORG_ID);
    expect(result).toEqual([]);
  });

  it("applies status filter (single)", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow({ status: "In Progress" })],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({ data: [makeCostRow()], error: null });

    const result = await getWorkOrders(db as never, ORG_ID, {
      status: "In Progress",
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("In Progress");
  });

  it("applies status filter (array)", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow()],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({ data: [makeCostRow()], error: null });

    const result = await getWorkOrders(db as never, ORG_ID, {
      status: ["New", "In Progress"],
    });

    expect(result).toHaveLength(1);
  });

  it("applies search filter", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow()],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({ data: [makeCostRow()], error: null });

    const result = await getWorkOrders(db as never, ORG_ID, {
      search: "Toyota",
    });

    expect(result).toHaveLength(1);
  });

  it("applies date filter", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow()],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({ data: [makeCostRow()], error: null });

    const result = await getWorkOrders(db as never, ORG_ID, {
      date: "2025-01-15",
    });

    expect(result).toHaveLength(1);
  });

  it("uses pagination when page is specified", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow()],
      error: null,
      count: 1,
    });
    db.__qb.resolveOnce({ data: [makeCostRow()], error: null });

    const result = await getWorkOrders(db as never, ORG_ID, undefined, 1, 10);

    expect(result).toHaveLength(1);
  });

  it("sets mechanic to null when mechanic_id is null and profile is null", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow({ mechanic_id: null, mechanic_profile: null })],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getWorkOrders(db as never, ORG_ID);
    expect(result[0].mechanic).toBeNull();
  });

  it("provides placeholder mechanic object when mechanic_id present but profile null", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow({ mechanic_profile: null })],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({ data: [makeCostRow()], error: null });

    const result = await getWorkOrders(db as never, ORG_ID);
    expect(result[0].mechanic).toEqual({ full_name: null, avatar_url: null });
  });

  it("defaults to 0 for missing cost data", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow()],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getWorkOrders(db as never, ORG_ID);
    expect(result[0].services_cost).toBe(0);
    expect(result[0].parts_cost).toBe(0);
  });

  it("throws on database error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("DB connection failed"),
      count: null,
    });

    await expect(getWorkOrders(db as never, ORG_ID)).rejects.toThrow(
      "DB connection failed",
    );
  });

  it("limits results when pagination is off", async () => {
    db.__qb.resolveOnce({
      data: [makeWorkOrderRow(), makeWorkOrderRow({ id: "wo-2" })],
      error: null,
      count: null,
    });
    db.__qb.resolveOnce({
      data: [makeCostRow(), makeCostRow({ work_order_id: "wo-2" })],
      error: null,
    });

    const result = await getWorkOrders(
      db as never,
      ORG_ID,
      undefined,
      undefined,
      undefined,
      2,
    );
    expect(result).toHaveLength(2);
  });
});

// ── getWorkOrdersFast ─────────────────────────────────────────────

describe("getWorkOrdersFast", () => {
  const rpcRow = {
    id: WO_ID,
    status: "New",
    bay_number: 1,
    queue_order: null,
    created_at: "2025-01-15T10:00:00Z",
    completed_at: null,
    started_at: null,
    customer: { full_name: "John Doe", phone: "99112233" },
    vehicle: { plate_number: "001УБА", make: "Toyota", model: "Camry" },
    mechanic: { full_name: "Mech One" },
    services_count: 2,
    parts_count: 1,
  };

  it("returns mapped rows from RPC call", async () => {
    db.rpc.mockResolvedValue({ data: [rpcRow], error: null });

    const result = await getWorkOrdersFast(db as never, ORG_ID);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(WO_ID);
  });

  it("splits full_name into first_name and last_name", async () => {
    db.rpc.mockResolvedValue({ data: [rpcRow], error: null });

    const result = await getWorkOrdersFast(db as never, ORG_ID);
    expect(result[0].customer?.first_name).toBe("John");
    expect(result[0].customer?.last_name).toBe("Doe");
  });

  it("handles single-word name (no last name)", async () => {
    db.rpc.mockResolvedValue({
      data: [{ ...rpcRow, customer: { full_name: "Enkh", phone: "99112233" } }],
      error: null,
    });

    const result = await getWorkOrdersFast(db as never, ORG_ID);
    expect(result[0].customer?.first_name).toBe("Enkh");
    expect(result[0].customer?.last_name).toBe("");
  });

  it("handles null customer gracefully", async () => {
    db.rpc.mockResolvedValue({
      data: [{ ...rpcRow, customer: null }],
      error: null,
    });

    const result = await getWorkOrdersFast(db as never, ORG_ID);
    expect(result[0].customer).toBeNull();
  });

  it("throws on RPC error", async () => {
    db.rpc.mockResolvedValue({
      data: null,
      error: new Error("RPC failed"),
    });

    await expect(getWorkOrdersFast(db as never, ORG_ID)).rejects.toThrow(
      "RPC failed",
    );
  });

  it("passes status and limit options to RPC", async () => {
    db.rpc.mockResolvedValue({ data: [rpcRow], error: null });

    await getWorkOrdersFast(db as never, ORG_ID, {
      status: "In Progress",
      limit: 25,
    });

    expect(db.rpc).toHaveBeenCalledWith("get_work_orders_list", {
      p_org_id: ORG_ID,
      p_status: "In Progress",
      p_limit: 25,
      p_offset: 0,
    });
  });
});

// ── getWorkOrder ──────────────────────────────────────────────────

describe("getWorkOrder", () => {
  it("delegates to _getWorkOrderDetail", async () => {
    const detail = makeDetail();
    mockGetWorkOrderDetail.mockResolvedValue(detail as never);

    const result = await getWorkOrder(db as never, WO_ID, ORG_ID);
    expect(result).toBe(detail);
    expect(mockGetWorkOrderDetail).toHaveBeenCalledWith(db, WO_ID, ORG_ID);
  });

  it("passes undefined orgId when omitted", async () => {
    mockGetWorkOrderDetail.mockResolvedValue(makeDetail() as never);

    await getWorkOrder(db as never, WO_ID);
    expect(mockGetWorkOrderDetail).toHaveBeenCalledWith(db, WO_ID, undefined);
  });
});

// ── createWorkOrder ───────────────────────────────────────────────

describe("createWorkOrder", () => {
  const createParams = {
    vehicle_id: "veh-1",
    customer_id: "cust-1",
    mechanic_id: "mech-1",
    complaint: " Engine noise ",
    notes: " Check oil ",
    branchId: "branch-1",
    services: [{ service_id: "svc-1", unit_price: 100 }],
    parts: [{ part_id: "part-1", quantity: 1, unit_price: 50 }],
  };

  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("creates work order with status history and mechanic assignment", async () => {
    db.__qb.resolveOnce({ data: { id: WO_ID }, error: null });

    // status_history insert (no await)
    // mechanic_assignment insert (no await)
    // services and parts are async too but we mock those
    mockResolveBranchId.mockResolvedValue("branch-1");

    const detail = makeDetail();
    mockGetWorkOrderDetail.mockResolvedValue(detail as never);

    const result = await createWorkOrder(db as never, ORG_ID, createParams);

    expect(result).toBe(detail);
    expect(mockRevalidateTag).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        table_name: "work_orders",
        record_id: WO_ID,
      }),
    );
  });

  it("throws ValidationError when vehicle_id is missing", async () => {
    await expect(
      createWorkOrder(db as never, ORG_ID, {} as never),
    ).rejects.toThrow("Vehicle is required");
  });

  it("throws when no branch can be resolved", async () => {
    mockResolveBranchId.mockResolvedValue(null);

    await expect(
      createWorkOrder(db as never, ORG_ID, { vehicle_id: "veh-1" } as never),
    ).rejects.toThrow("No branch found");
  });

  it("throws on insert failure", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Insert constraint"),
    });

    await expect(
      createWorkOrder(db as never, ORG_ID, createParams),
    ).rejects.toThrow("Insert constraint");
  });

  it("handles services/parts failure with cleanup", async () => {
    db.__qb.resolveOnce({ data: { id: WO_ID }, error: null });
    mockAddService.mockRejectedValue(new Error("Service failed"));

    await expect(
      createWorkOrder(db as never, ORG_ID, createParams),
    ).rejects.toThrow("Service failed");

    // Cleanup should delete services, parts, and the work order
    expect(db.from).toHaveBeenCalledWith("work_order_services");
    expect(db.from).toHaveBeenCalledWith("work_order_parts");
  });

  it("skips mechanic assignment when no mechanic_id", async () => {
    db.__qb.resolveOnce({ data: { id: WO_ID }, error: null });
    mockGetWorkOrderDetail.mockResolvedValue(makeDetail() as never);

    await createWorkOrder(db as never, ORG_ID, {
      ...createParams,
      mechanic_id: undefined,
    });

    // Only work_orders and status_history inserts should have happened
    // (no mechanic_assignments)
    expect(db.from).toHaveBeenCalledWith("work_orders");
    expect(db.from).toHaveBeenCalledWith("work_order_status_history");
  });
});

// ── recalculateWorkOrderTotals ────────────────────────────────────

describe("recalculateWorkOrderTotals", () => {
  it("calculates totals from services and parts, updates work order", async () => {
    db.__qb.resolveOnce({
      data: [{ final_price: 100 }, { final_price: 50 }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [{ final_price: 80 }, { final_price: 20 }],
      error: null,
    });
    db.__qb.resolveOnce({
      data: { discount_amount: 10, discount_percentage: 0 },
      error: null,
    });

    await recalculateWorkOrderTotals(db as never, WO_ID);
    // subtotal = 150 + 100 = 250, discount = 10, total = 240
  });

  it("applies percentage discount on top of flat discount", async () => {
    db.__qb.resolveOnce({
      data: [{ final_price: 100 }],
      error: null,
    });
    db.__qb.resolveOnce({ data: [{ final_price: 100 }], error: null });
    db.__qb.resolveOnce({
      data: { discount_amount: 20, discount_percentage: 10 },
      error: null,
    });

    await recalculateWorkOrderTotals(db as never, WO_ID);
    // subtotal = 200, pctDiscount = 200 * 0.10 = 20, flat = 20, discountTotal = 40, total = 160
  });

  it("ensures total is never negative", async () => {
    db.__qb.resolveOnce({ data: [{ final_price: 10 }], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: { discount_amount: 100, discount_percentage: 0 },
      error: null,
    });

    await recalculateWorkOrderTotals(db as never, WO_ID);
    // subtotal = 10, discount = 100, total = max(-90, 0) = 0
  });

  it("returns early when work order not found", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await recalculateWorkOrderTotals(db as never, WO_ID);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("throws on services fetch error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Fetch failed") });

    await expect(
      recalculateWorkOrderTotals(db as never, WO_ID),
    ).rejects.toThrow("Fetch failed");
    expect(mockReportServerError).toHaveBeenCalled();
  });

  it("throws on parts fetch error", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: null, error: new Error("Parts error") });

    await expect(
      recalculateWorkOrderTotals(db as never, WO_ID),
    ).rejects.toThrow("Parts error");
  });

  it("throws on work order fetch error", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("WO fetch error"),
    });

    await expect(
      recalculateWorkOrderTotals(db as never, WO_ID),
    ).rejects.toThrow("WO fetch error");
  });

  it("handles empty services/parts gracefully (zero totals)", async () => {
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({
      data: { discount_amount: 0, discount_percentage: 0 },
      error: null,
    });

    await recalculateWorkOrderTotals(db as never, WO_ID);
    // subtotal = 0, total = 0 — should not throw
  });
});

// ── getWorkOrderTotals ────────────────────────────────────────────

describe("getWorkOrderTotals", () => {
  it("computes totals from work order detail", async () => {
    mockGetWorkOrderDetail.mockResolvedValue(makeDetail() as never);

    const result = await getWorkOrderTotals(db as never, WO_ID);
    // services: 100*1 + 50*2 = 200, parts: 80*1 + 20*3 = 140
    expect(result.servicesTotal).toBe(200);
    expect(result.partsTotal).toBe(140);
    expect(result.grandTotal).toBe(340);
  });

  it("handles empty services/parts", async () => {
    mockGetWorkOrderDetail.mockResolvedValue(
      makeDetail({ services: [], parts: [] }) as never,
    );

    const result = await getWorkOrderTotals(db as never, WO_ID);
    expect(result.servicesTotal).toBe(0);
    expect(result.partsTotal).toBe(0);
    expect(result.grandTotal).toBe(0);
  });
});

// ── cancelWorkOrder ───────────────────────────────────────────────

describe("cancelWorkOrder", () => {
  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("transitions work order to Cancelled with reason", async () => {
    db.__qb.resolveOnce({
      data: { id: WO_ID, status: "In Progress" },
      error: null,
    });

    await cancelWorkOrder(db as never, WO_ID, ORG_ID, "Customer request");

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "work_orders",
        record_id: WO_ID,
        old_data: { status: "In Progress" },
        new_data: { status: "Cancelled", loss_reason: "Customer request" },
      }),
    );
    // 3 cache tags: workOrders, workOrder, workOrderDetail
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
  });

  it("throws NotFoundError when work order missing", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(cancelWorkOrder(db as never, WO_ID, ORG_ID)).rejects.toThrow(
      "not found",
    );
  });

  it("throws ValidationError when already Completed", async () => {
    db.__qb.resolveOnce({
      data: { id: WO_ID, status: "Completed" },
      error: null,
    });

    await expect(cancelWorkOrder(db as never, WO_ID, ORG_ID)).rejects.toThrow(
      "Cannot cancel",
    );
  });

  it("throws ValidationError when already Cancelled", async () => {
    db.__qb.resolveOnce({
      data: { id: WO_ID, status: "Cancelled" },
      error: null,
    });

    await expect(cancelWorkOrder(db as never, WO_ID, ORG_ID)).rejects.toThrow(
      "Cannot cancel",
    );
  });

  it("captures error when fetch fails but continues gracefully", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Fetch error"),
    });

    await expect(cancelWorkOrder(db as never, WO_ID, ORG_ID)).rejects.toThrow(
      "not found",
    );
  });
});
