import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    estimates: (o: string) => `estimates:${o}`,
    estimate: (id: string) => `estimate:${id}`,
    workOrders: (o: string) => `work-orders:${o}`,
  },
}));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  UnauthorizedError: class extends Error {
    constructor(msg?: string) {
      super(msg ?? "Unauthorized");
      this.name = "UnauthorizedError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
  withBranchFilter: vi.fn((q: unknown) => q),
}));
vi.mock("@/lib/services/work-order-items-service", () => ({
  addPartToWorkOrder: vi.fn().mockResolvedValue(undefined),
  addServiceToWorkOrder: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/work-order-service", () => ({
  recalculateWorkOrderTotals: vi.fn().mockResolvedValue(undefined),
  getWorkOrder: vi.fn().mockResolvedValue({
    id: "wo-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    status: "New",
    customer: { id: "cust-1", first_name: "John", last_name: "Doe" },
    vehicle: {
      id: "veh-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
    },
    services: [],
    parts: [],
    mechanic: null,
    helpers: [],
    status_history: [],
    service_history: [],
    complaint: null,
    diagnosis: null,
    description: null,
    notes: "Test notes",
    mechanic_notes: null,
    diagnosis_label_id: null,
    bay_number: null,
    queue_order: 0,
    odometer_at_service: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    subtotal: 40000,
    total: 40000,
    created_at: "2025-06-01T10:00:00Z",
    updated_at: "2025-06-01T10:00:00Z",
    created_by: "user-1",
    updated_by: "user-1",
    deleted_at: null,
    completed_at: null,
    started_at: null,
    loss_reason: null,
    diagnosis_label: null,
    invoice_public_token: null,
    attachments: [],
    nuat_enabled: null,
  }),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { capture } from "@/lib/capture";
import { reportServerError } from "@/lib/sentry-report-server";
import {
  addPartToWorkOrder,
  addServiceToWorkOrder,
} from "@/lib/services/work-order-items-service";
import {
  getWorkOrder,
  recalculateWorkOrderTotals,
} from "@/lib/services/work-order-service";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockCapture = vi.mocked(capture);
const mockReportServerError = vi.mocked(reportServerError);
const mockResolveBranchId = vi.mocked(resolveBranchId);
const mockWithBranchFilter = vi.mocked(withBranchFilter);
const mockAddServiceToWorkOrder = vi.mocked(addServiceToWorkOrder);
const mockAddPartToWorkOrder = vi.mocked(addPartToWorkOrder);
const mockRecalculateWorkOrderTotals = vi.mocked(recalculateWorkOrderTotals);
const mockGetWorkOrder = vi.mocked(getWorkOrder);

import {
  convertEstimateToWorkOrder,
  createEstimate,
  deleteEstimate,
  getEstimate,
  getEstimates,
  updateEstimate,
  updateEstimateStatus,
} from "../estimate-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const EST_ID = "est-1";

let db: ReturnType<typeof createMockSupabaseClient>;

function makeEstimate(o: Record<string, unknown> = {}) {
  return {
    id: EST_ID,
    organization_id: ORG_ID,
    branch_id: "branch-1",
    estimate_number: "EST-0001",
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    status: "draft",
    notes: null,
    terms: null,
    valid_until: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 0,
    subtotal: 40000,
    grand_total: 40000,
    tax_total: 0,
    converted_work_order_id: null,
    appointment_id: null,
    public_token: "tok-xxx",
    created_by: USER_ID,
    updated_by: USER_ID,
    created_at: "2025-06-01T10:00:00Z",
    updated_at: "2025-06-01T10:00:00Z",
    deleted_at: null,
    customer: {
      id: "cust-1",
      first_name: "John",
      last_name: "Doe",
      phone: "+97688112233",
    },
    vehicle: {
      id: "veh-1",
      plate_number: "ABC123",
      make: "Toyota",
      model: "Camry",
    },
    items: [
      {
        id: "item-1",
        estimate_id: EST_ID,
        organization_id: ORG_ID,
        item_type: "service",
        description: "Oil Change",
        quantity: 1,
        unit_price: 30000,
        unit_cost: 0,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 30000,
        sort_order: 0,
        notes: null,
        source_service_id: null,
        source_part_id: null,
        created_by: USER_ID,
      },
      {
        id: "item-2",
        estimate_id: EST_ID,
        organization_id: ORG_ID,
        item_type: "part",
        description: "Oil Filter",
        quantity: 1,
        unit_price: 10000,
        unit_cost: 0,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 10000,
        sort_order: 1,
        notes: null,
        source_service_id: null,
        source_part_id: null,
        created_by: USER_ID,
      },
    ],
    converted_work_order: null,
    appointment: null,
    ...o,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  db = createMockSupabaseClient();
});

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Push N copies of resolveOnce with { data: null, error: null } to fill the
 * queue past awaits that don't need specific data (recalc estimate totals
 * Promise.all, etc.). The mock's default resolveWith is already this value,
 * so these just pad the FIFO queue correctly.
 */
function fillResolveOnce(n: number) {
  for (let i = 0; i < n; i++) {
    db.__qb.resolveOnce({ data: null, error: null });
  }
}

// ── getEstimates ──────────────────────────────────────────────────

describe("getEstimates", () => {
  it("returns paginated estimates", async () => {
    const rows = [makeEstimate({ id: "e1" }), makeEstimate({ id: "e2" })];
    db.__qb.resolveWith({ data: rows, count: 2, error: null });

    const result = await getEstimates(db as never, ORG_ID, {
      page: 1,
      pageSize: 10,
    });

    expect(result.data).toHaveLength(2);
    expect(result.count).toBe(2);
  });

  it("returns unpaginated estimates with default limit", async () => {
    const rows = [makeEstimate()];
    db.__qb.resolveWith({ data: rows, count: 0, error: null });

    const result = await getEstimates(db as never, ORG_ID);

    expect(result.data).toHaveLength(1);
    expect(result.count).toBe(0);
  });

  it("applies status filter", async () => {
    db.__qb.resolveWith({ data: [makeEstimate()], count: 1, error: null });

    await getEstimates(db as never, ORG_ID, { status: "approved" });

    const qb = db.from.mock.results[0]?.value;
    expect(qb.eq).toHaveBeenCalledWith("status", "approved");
  });

  it("applies customer filter", async () => {
    db.__qb.resolveWith({ data: [makeEstimate()], count: 1, error: null });

    await getEstimates(db as never, ORG_ID, { customer_id: "cust-1" });

    const qb = db.from.mock.results[0]?.value;
    expect(qb.eq).toHaveBeenCalledWith("customer_id", "cust-1");
  });

  it("applies date range filters", async () => {
    db.__qb.resolveWith({ data: [makeEstimate()], count: 1, error: null });

    await getEstimates(db as never, ORG_ID, {
      date_from: "2025-01-01",
      date_to: "2025-06-30",
    });

    const qb = db.from.mock.results[0]?.value;
    expect(qb.gte).toHaveBeenCalledWith("created_at", "2025-01-01");
    expect(qb.lte).toHaveBeenCalledWith("created_at", "2025-06-30");
  });

  it("applies branch filter via withBranchFilter", async () => {
    db.__qb.resolveWith({ data: [makeEstimate()], count: 1, error: null });

    await getEstimates(db as never, ORG_ID, { branchId: "branch-1" });

    expect(mockWithBranchFilter).toHaveBeenCalled();
  });

  it("applies search filter via matching customer/vehicle ids", async () => {
    // customers match
    db.__qb.resolveOnce({ data: [{ id: "cust-1" }], error: null });
    // vehicles match
    db.__qb.resolveOnce({ data: [{ id: "veh-1" }], error: null });
    // estimates (main query)
    db.__qb.resolveOnce({ data: [makeEstimate()], count: 1, error: null });

    await getEstimates(db as never, ORG_ID, { search: "John" });

    expect(db.from).toHaveBeenCalledWith("customers");
    expect(db.from).toHaveBeenCalledWith("vehicles");
    const qb = db.from.mock.results[0]?.value;
    expect(qb.or).toHaveBeenCalledWith(
      "estimate_number.ilike.%John%,customer_id.in.(cust-1),vehicle_id.in.(veh-1)",
    );
  });

  it("searches by estimate_number alone when no customer/vehicle matches", async () => {
    // customers no match
    db.__qb.resolveOnce({ data: [], error: null });
    // vehicles no match
    db.__qb.resolveOnce({ data: [], error: null });
    // estimates (main query)
    db.__qb.resolveOnce({ data: [makeEstimate()], count: 1, error: null });

    await getEstimates(db as never, ORG_ID, { search: "EST-42" });

    const qb = db.from.mock.results[0]?.value;
    expect(qb.or).toHaveBeenCalledWith("estimate_number.ilike.%EST-42%");
  });

  it("captures error and returns empty", async () => {
    const err = new Error("DB error");
    db.__qb.resolveWith({ data: null, count: null, error: err });

    const result = await getEstimates(db as never, ORG_ID);

    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
    expect(mockCapture).toHaveBeenCalled();
  });
});

// ── getEstimate ──────────────────────────────────────────────────

describe("getEstimate", () => {
  it("returns a single estimate with relations", async () => {
    const est = makeEstimate();
    db.__qb.resolveWith({ data: est, error: null });

    const result = await getEstimate(db as never, EST_ID, ORG_ID);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(EST_ID);
    expect(result?.items).toHaveLength(2);
    expect(result?.customer).not.toBeNull();
    expect(result?.vehicle).not.toBeNull();
  });

  it("returns null when not found", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    const result = await getEstimate(db as never, "nonexistent", ORG_ID);

    expect(result).toBeNull();
  });

  it("captures error and returns null", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("fail") });

    const result = await getEstimate(db as never, EST_ID, ORG_ID);

    expect(result).toBeNull();
    expect(mockCapture).toHaveBeenCalled();
  });
});

// ── createEstimate ──────────────────────────────────────────────────

describe("createEstimate", () => {
  function makeCreateParams(overrides: Record<string, unknown> = {}) {
    return {
      customer_id: "cust-1",
      vehicle_id: "veh-1",
      status: "draft" as const,
      items: [
        {
          item_type: "service" as const,
          description: "Oil Change",
          quantity: 1,
          unit_price: 30000,
        },
        {
          item_type: "part" as const,
          description: "Oil Filter",
          quantity: 1,
          unit_price: 10000,
        },
      ],
      ...overrides,
    };
  }

  // createEstimate qb awaits (with userId_ passed, no auth.getUser call):
  // 1. insert().select("id").single()
  // 2. insert(items)
  // 3. recalcEstimateTotals: Promise.all[items select, estimate select.single]
  //    -> estimate is null -> returns early, no update await
  // 4. getEstimate: select...single()

  it("creates estimate, inserts items, audits, invalidates cache", async () => {
    db.__qb.resolveOnce({ data: { id: EST_ID }, error: null }); // #1 insert id
    db.__qb.resolveOnce({ data: null, error: null }); // #2 insert items
    fillResolveOnce(2); // #3, #4 recalc Promise.all
    db.__qb.resolveOnce({ data: makeEstimate(), error: null }); // #5 getEstimate

    db.rpc.mockResolvedValueOnce({ data: "EST-0001", error: null });

    const result = await createEstimate(
      db as never,
      ORG_ID,
      makeCreateParams(),
      USER_ID,
    );

    expect(result.id).toBe(EST_ID);
    expect(result.estimate_number).toBe("EST-0001");
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        table_name: "estimates",
        record_id: EST_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `estimates:${ORG_ID}`,
      "max",
    );
  });

  it("throws ValidationError when customer_id is missing", async () => {
    await expect(
      createEstimate(
        db as never,
        ORG_ID,
        makeCreateParams({ customer_id: "" }),
        USER_ID,
      ),
    ).rejects.toThrow("Customer is required");
  });

  it("throws ValidationError when vehicle_id is missing", async () => {
    await expect(
      createEstimate(
        db as never,
        ORG_ID,
        makeCreateParams({ vehicle_id: "" }),
        USER_ID,
      ),
    ).rejects.toThrow("Vehicle is required");
  });

  it("throws ValidationError when no items provided", async () => {
    await expect(
      createEstimate(
        db as never,
        ORG_ID,
        makeCreateParams({ items: [] }),
        USER_ID,
      ),
    ).rejects.toThrow("At least one item is required");
  });

  it("throws UnauthorizedError when no userId resolved", async () => {
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      createEstimate(db as never, ORG_ID, makeCreateParams(), undefined),
    ).rejects.toThrow("Unauthorized");
  });

  it("cleans up estimate if items insert fails", async () => {
    // Fail at items insert (step 2) -> cleanup
    db.__qb.resolveOnce({ data: { id: EST_ID }, error: null }); // #1 insert id
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Items insert failed" },
    }); // #2 insert items

    db.rpc.mockResolvedValueOnce({ data: "EST-0001", error: null });

    await expect(
      createEstimate(db as never, ORG_ID, makeCreateParams(), USER_ID),
    ).rejects.toThrow("Items insert failed");

    // Should have cleaned up the estimate
    const qb = db.from.mock.results[1]?.value;
    expect(qb.delete).toHaveBeenCalled();
  });

  it("throws error when estimate insert returns no id", async () => {
    db.__qb.resolveOnce({ data: null, error: null }); // #1 insert id - returns null data

    db.rpc.mockResolvedValueOnce({ data: "EST-0001", error: null });

    await expect(
      createEstimate(db as never, ORG_ID, makeCreateParams(), USER_ID),
    ).rejects.toThrow("Failed to create estimate");
  });
});

// ── updateEstimate ──────────────────────────────────────────────────

// updateEstimate qb awaits (no items, with userId):
// 1. fetch old: select...single()
// 2. update header
// 3-4. recalcEstimateTotals: Promise.all[items select, estimate select.single]
// 5. getEstimate after update

// updateEstimate qb awaits (with items):
// 1. fetch old: select...single()
// 2. update header
// 3. delete items
// 4. insert items
// 5-6. recalcEstimateTotals: Promise.all[items select, estimate select.single]
// 7. getEstimate after update

describe("updateEstimate", () => {
  it("updates header fields and revalidates cache", async () => {
    db.__qb.resolveOnce({
      data: {
        id: EST_ID,
        status: "draft",
        notes: null,
        terms: null,
        discount_amount: 0,
        discount_percentage: 0,
        tax_total: 0,
      },
      error: null,
    }); // #1
    db.__qb.resolveOnce({ data: null, error: null }); // #2 update
    fillResolveOnce(2); // #3, #4 recalc
    db.__qb.resolveOnce({
      data: makeEstimate({ status: "sent" }),
      error: null,
    }); // #5 getEstimate

    const result = await updateEstimate(
      db as never,
      EST_ID,
      ORG_ID,
      { status: "sent" },
      USER_ID,
    );

    expect(result.status).toBe("sent");
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "estimates",
        record_id: EST_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `estimates:${ORG_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`estimate:${EST_ID}`, "max");
  });

  it("replaces items when items param is provided", async () => {
    db.__qb.resolveOnce({
      data: {
        id: EST_ID,
        status: "draft",
        notes: null,
        terms: null,
        discount_amount: 0,
        discount_percentage: 0,
        tax_total: 0,
      },
      error: null,
    }); // #1
    db.__qb.resolveOnce({ data: null, error: null }); // #2 update header
    db.__qb.resolveOnce({ data: null, error: null }); // #3 delete items
    db.__qb.resolveOnce({ data: null, error: null }); // #4 insert items
    fillResolveOnce(2); // #5, #6 recalc
    db.__qb.resolveOnce({ data: makeEstimate(), error: null }); // #7 getEstimate

    await updateEstimate(
      db as never,
      EST_ID,
      ORG_ID,
      {
        notes: "Updated notes",
        items: [
          {
            item_type: "service",
            description: "Full Service",
            quantity: 1,
            unit_price: 50000,
          },
        ],
      },
      USER_ID,
    );

    // Should have deleted old items and inserted new ones
    const qb = db.from.mock.results[0]?.value;
    expect(qb.delete).toHaveBeenCalled();
  });

  it("throws NotFoundError on update when estimate missing", async () => {
    db.__qb.resolveOnce({ data: null, error: null }); // #1 fetch old (no data, no error -> no capture)
    db.__qb.resolveOnce({
      data: null,
      error: { message: "not found", code: "PGRST116" },
    }); // #2 update fails

    await expect(
      updateEstimate(
        db as never,
        "nonexistent",
        ORG_ID,
        { notes: "x" },
        USER_ID,
      ),
    ).rejects.toThrow("Estimate not found");
  });

  it("throws NotFoundError when updated estimate not found", async () => {
    db.__qb.resolveOnce({
      data: {
        id: EST_ID,
        status: "draft",
        notes: null,
        terms: null,
        discount_amount: 0,
        discount_percentage: 0,
        tax_total: 0,
      },
      error: null,
    }); // #1
    db.__qb.resolveOnce({ data: null, error: null }); // #2 update
    fillResolveOnce(2); // #3, #4 recalc
    db.__qb.resolveOnce({ data: null, error: null }); // #5 getEstimate returns null

    await expect(
      updateEstimate(
        db as never,
        EST_ID,
        ORG_ID,
        { notes: "updated" },
        USER_ID,
      ),
    ).rejects.toThrow("Estimate not found");
  });

  it("throws error when delete items fails", async () => {
    db.__qb.resolveOnce({
      data: {
        id: EST_ID,
        status: "draft",
        notes: null,
        terms: null,
        discount_amount: 0,
        discount_percentage: 0,
        tax_total: 0,
      },
      error: null,
    }); // #1
    db.__qb.resolveOnce({ data: null, error: null }); // #2 update header
    db.__qb.resolveOnce({ data: null, error: { message: "Delete failed" } }); // #3 delete items - fails

    await expect(
      updateEstimate(
        db as never,
        EST_ID,
        ORG_ID,
        {
          items: [{ item_type: "service", description: "x", unit_price: 100 }],
        },
        USER_ID,
      ),
    ).rejects.toThrow("Failed to delete estimate items");
  });
});

// ── updateEstimateStatus ──────────────────────────────────────────

describe("updateEstimateStatus", () => {
  it("delegates to updateEstimate with status only", async () => {
    db.__qb.resolveOnce({
      data: {
        id: EST_ID,
        status: "draft",
        notes: null,
        terms: null,
        discount_amount: 0,
        discount_percentage: 0,
        tax_total: 0,
      },
      error: null,
    }); // #1
    db.__qb.resolveOnce({ data: null, error: null }); // #2 update
    fillResolveOnce(2); // #3, #4 recalc
    db.__qb.resolveOnce({
      data: makeEstimate({ status: "approved" }),
      error: null,
    }); // #5 getEstimate

    const result = await updateEstimateStatus(
      db as never,
      EST_ID,
      ORG_ID,
      "approved",
    );

    expect(result.status).toBe("approved");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});

// ── deleteEstimate ──────────────────────────────────────────────────

describe("deleteEstimate", () => {
  it("soft-deletes and invalidates cache", async () => {
    db.__qb.resolveWith({ data: null, error: null });

    await deleteEstimate(db as never, EST_ID, ORG_ID);

    const qb = db.from.mock.results[0]?.value;
    expect(qb.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `estimates:${ORG_ID}`,
      "max",
    );
  });

  it("throws NotFoundError when estimate not found", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "not found" } });

    await expect(
      deleteEstimate(db as never, "nonexistent", ORG_ID),
    ).rejects.toThrow("Estimate not found");
  });
});

// ── convertEstimateToWorkOrder ──────────────────────────────────────

// convertEstimateToWorkOrder qb awaits (with userId):
// 1. getEstimate: select...single()
// 2. insert work_order: insert...select("id").single()
// 3. insert status_history
// 4. update estimate status

describe("convertEstimateToWorkOrder", () => {
  const approvedEstimate = makeEstimate({
    status: "approved",
    estimate_number: "EST-0001",
    customer_id: "cust-1",
    vehicle_id: "veh-1",
    discount_amount: 0,
    discount_percentage: 0,
    notes: "Test notes",
    items: [
      {
        id: "item-1",
        estimate_id: EST_ID,
        organization_id: ORG_ID,
        item_type: "service",
        description: "Oil Change",
        quantity: 1,
        unit_price: 30000,
        unit_cost: 0,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 30000,
        sort_order: 0,
        notes: null,
        source_service_id: "svc-1",
        source_part_id: null,
        created_by: USER_ID,
      },
      {
        id: "item-2",
        estimate_id: EST_ID,
        organization_id: ORG_ID,
        item_type: "part",
        description: "Oil Filter",
        quantity: 1,
        unit_price: 10000,
        unit_cost: 0,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 10000,
        sort_order: 1,
        notes: null,
        source_service_id: null,
        source_part_id: "part-1",
        created_by: USER_ID,
      },
    ],
  });

  it("converts approved estimate to work order", async () => {
    // vi.resetAllMocks() in beforeEach cleared the mock factories' resolved values
    mockGetWorkOrder.mockResolvedValue({
      id: "wo-1",
      organization_id: "org-1",
      branch_id: "branch-1",
      status: "New",
      customer: { id: "cust-1", first_name: "John", last_name: "Doe" },
      vehicle: {
        id: "veh-1",
        plate_number: "ABC123",
        make: "Toyota",
        model: "Camry",
      },
      services: [],
      parts: [],
      mechanic: null,
      helpers: [],
      status_history: [],
      service_history: [],
      complaint: null,
      diagnosis: null,
      description: null,
      notes: "Test notes",
      mechanic_notes: null,
      diagnosis_label_id: null,
      bay_number: null,
      queue_order: 0,
      odometer_at_service: null,
      discount_amount: 0,
      discount_percentage: 0,
      discount_total: 0,
      subtotal: 40000,
      total: 40000,
      created_at: "2025-06-01T10:00:00Z",
      updated_at: "2025-06-01T10:00:00Z",
      created_by: "user-1",
      updated_by: "user-1",
      deleted_at: null,
      completed_at: null,
      started_at: null,
      loss_reason: null,
      diagnosis_label: null,
      invoice_public_token: null,
      attachments: [],
      nuat_enabled: null,
    });

    db.__qb.resolveOnce({ data: approvedEstimate, error: null }); // #1 getEstimate
    db.__qb.resolveOnce({ data: { id: "wo-1" }, error: null }); // #2 insert work_order
    db.__qb.resolveOnce({ data: null, error: null }); // #3 insert status_history
    db.__qb.resolveOnce({ data: null, error: null }); // #4 update estimate status

    const result = await convertEstimateToWorkOrder(
      db as never,
      EST_ID,
      ORG_ID,
      USER_ID,
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe("wo-1");
    expect(result?.status).toBe("New");

    // Should add service and part items to work order
    expect(mockAddServiceToWorkOrder).toHaveBeenCalledWith(
      db as never,
      "wo-1",
      ORG_ID,
      expect.objectContaining({ service_name: "Oil Change" }),
    );
    expect(mockAddPartToWorkOrder).toHaveBeenCalledWith(
      db as never,
      "wo-1",
      ORG_ID,
      expect.objectContaining({ part_name: "Oil Filter" }),
    );

    // Should recalculate totals
    expect(mockRecalculateWorkOrderTotals).toHaveBeenCalledWith(
      db as never,
      "wo-1",
    );

    // Should audit
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "estimates",
        record_id: EST_ID,
        new_data: { status: "converted", converted_work_order_id: "wo-1" },
      }),
    );

    // Should invalidate caches
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `estimates:${ORG_ID}`,
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(`estimate:${EST_ID}`, "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `work-orders:${ORG_ID}`,
      "max",
    );

    // Should return the work order detail
    expect(mockGetWorkOrder).toHaveBeenCalledWith(db as never, "wo-1", ORG_ID);
  });

  it("throws ValidationError when estimate is not approved", async () => {
    const draftEstimate = makeEstimate({ status: "draft" });
    db.__qb.resolveOnce({ data: draftEstimate, error: null }); // #1 getEstimate

    await expect(
      convertEstimateToWorkOrder(db as never, EST_ID, ORG_ID, USER_ID),
    ).rejects.toThrow('Cannot convert estimate with status "draft"');
  });

  it("throws ValidationError when estimate already converted", async () => {
    const convertedEstimate = makeEstimate({
      status: "approved",
      converted_work_order: { id: "wo-1", status: "New", total: 40000 },
      converted_work_order_id: "wo-1",
    });
    db.__qb.resolveOnce({ data: convertedEstimate, error: null }); // #1 getEstimate

    await expect(
      convertEstimateToWorkOrder(db as never, EST_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("already been converted");
  });

  it("throws UnauthorizedError when no userId", async () => {
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      convertEstimateToWorkOrder(db as never, EST_ID, ORG_ID, undefined),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws NotFoundError when estimate does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null }); // #1 getEstimate returns null

    await expect(
      convertEstimateToWorkOrder(db as never, "nonexistent", ORG_ID, USER_ID),
    ).rejects.toThrow("Estimate not found");
  });

  it("handles custom items as service items", async () => {
    const customEstimate = makeEstimate({
      status: "approved",
      items: [
        {
          id: "item-3",
          estimate_id: EST_ID,
          organization_id: ORG_ID,
          item_type: "custom",
          description: "Custom Labor",
          quantity: 2,
          unit_price: 15000,
          unit_cost: 0,
          discount_amount: 0,
          discount_percentage: 0,
          line_total: 30000,
          sort_order: 0,
          notes: "Special work",
          source_service_id: null,
          source_part_id: null,
          created_by: USER_ID,
        },
      ],
    });

    db.__qb.resolveOnce({ data: customEstimate, error: null }); // #1 getEstimate
    db.__qb.resolveOnce({ data: { id: "wo-2" }, error: null }); // #2 insert work_order
    db.__qb.resolveOnce({ data: null, error: null }); // #3 insert status_history
    db.__qb.resolveOnce({ data: null, error: null }); // #4 update estimate status

    await convertEstimateToWorkOrder(db as never, EST_ID, ORG_ID, USER_ID);

    // Custom items should be added as services
    expect(mockAddServiceToWorkOrder).toHaveBeenCalledWith(
      db as never,
      "wo-2",
      ORG_ID,
      expect.objectContaining({
        service_name: "Custom Labor",
        quantity: 2,
        unit_price: 15000,
      }),
    );
  });

  it("reports error when converting estimate status fails", async () => {
    db.__qb.resolveOnce({ data: approvedEstimate, error: null }); // #1 getEstimate
    db.__qb.resolveOnce({ data: { id: "wo-1" }, error: null }); // #2 insert work_order
    db.__qb.resolveOnce({ data: null, error: null }); // #3 insert status_history
    db.__qb.resolveOnce({ data: null, error: { message: "Update failed" } }); // #4 update estimate status

    await expect(
      convertEstimateToWorkOrder(db as never, EST_ID, ORG_ID, USER_ID),
    ).rejects.toThrow("Failed to convert estimate");

    expect(mockReportServerError).toHaveBeenCalled();
  });
});
