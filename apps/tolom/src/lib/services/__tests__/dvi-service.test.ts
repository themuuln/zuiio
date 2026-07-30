import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

// ── Module-level mocks ────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    workOrders: (orgId: string) => `work-orders:${orgId}`,
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { reportServerError } from "@/lib/sentry-report-server";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockReportServerError = vi.mocked(reportServerError);

import { ValidationError, NotFoundError } from "@/lib/errors";
import {
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  addInspectionItem,
  updateInspectionItem,
  removeInspectionItem,
  sendInspectionToCustomer,
  submitCustomerApproval,
  convertInspectionToWorkOrder,
} from "../dvi-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const VEHICLE_ID = "v-1";
const INSPECTION_ID = "dvi-1";
const ITEM_ID = "dvi-item-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── Helpers ───────────────────────────────────────────────────────

const makeInspectionRow = (overrides: Record<string, unknown> = {}) => ({
  id: INSPECTION_ID,
  organization_id: ORG_ID,
  vehicle_id: VEHICLE_ID,
  status: "draft" as const,
  customer_token_hash: null,
  work_order_id: null,
  odometer: null,
  fuel_level: null,
  technician_notes: null,
  created_by: USER_ID,
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
  ...overrides,
});

const makeItemRow = (overrides: Record<string, unknown> = {}) => ({
  id: ITEM_ID,
  inspection_id: INSPECTION_ID,
  category: "safety" as const,
  item_name: "Brake pads",
  condition: "fair" as const,
  severity: "major" as const,
  notes: null,
  customer_approved: null,
  created_at: "2026-07-01T00:00:00Z",
  ...overrides,
});

// ── getInspections ────────────────────────────────────────────────

describe("getInspections", () => {
  it("returns all inspections for org", async () => {
    const row = makeInspectionRow();
    db.__qb.resolveOnce({ data: [row], error: null });

    const result = await getInspections(db, ORG_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(INSPECTION_ID);
    expect(result[0].organization_id).toBe(ORG_ID);
  });

  it("filters by status", async () => {
    const row = makeInspectionRow();
    db.__qb.resolveOnce({ data: [row], error: null });

    await getInspections(db, ORG_ID, { status: "draft" });

    expect(db.from("digital_vehicle_inspections").eq).toHaveBeenCalledWith(
      "status",
      "draft",
    );
  });

  it("filters by vehicle_id", async () => {
    const row = makeInspectionRow();
    db.__qb.resolveOnce({ data: [row], error: null });

    await getInspections(db, ORG_ID, { vehicleId: VEHICLE_ID });

    expect(db.from("digital_vehicle_inspections").eq).toHaveBeenCalledWith(
      "vehicle_id",
      VEHICLE_ID,
    );
  });

  it("handles empty results", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getInspections(db, ORG_ID);
    expect(result).toHaveLength(0);
  });

  it("handles null data and returns empty array", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await getInspections(db, ORG_ID);
    expect(result).toHaveLength(0);
  });

  it("handles db error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: new Error("DB connection failed"),
    });

    await expect(getInspections(db, ORG_ID)).rejects.toThrow(
      "DB connection failed",
    );
    expect(mockReportServerError).toHaveBeenCalledWith(
      "getInspections",
      expect.any(Error),
    );
  });
});

// ── getInspection ─────────────────────────────────────────────────

describe("getInspection", () => {
  it("returns inspection with items", async () => {
    const row = makeInspectionRow({
      items: [makeItemRow()],
    });
    db.__qb.resolveOnce({ data: row, error: null });

    const result = await getInspection(db, INSPECTION_ID, ORG_ID);

    expect(result.inspection.id).toBe(INSPECTION_ID);
    expect(result.inspection.organization_id).toBe(ORG_ID);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].item_name).toBe("Brake pads");
    expect(result.items[0].category).toBe("safety");
  });

  it("throws NotFoundError for missing inspection", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("not found") });

    await expect(
      getInspection(db, INSPECTION_ID, ORG_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when data is null without error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      getInspection(db, INSPECTION_ID, ORG_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── createInspection ──────────────────────────────────────────────

describe("createInspection", () => {
  const validParams = {
    vehicle_id: VEHICLE_ID,
  };

  it("creates inspection successfully", async () => {
    const row = makeInspectionRow();
    db.__qb.resolveOnce({ data: row, error: null });

    const result = await createInspection(db, ORG_ID, USER_ID, validParams);

    expect(result.id).toBe(INSPECTION_ID);
    expect(result.status).toBe("draft");
    expect(result.vehicle_id).toBe(VEHICLE_ID);
    expect(result.created_by).toBe(USER_ID);
    expect(db.from("digital_vehicle_inspections").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        vehicle_id: VEHICLE_ID,
        status: "draft",
        created_by: USER_ID,
      }),
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: db,
        action: "create",
        table_name: "digital_vehicle_inspections",
        record_id: INSPECTION_ID,
        user_id: USER_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("creates with optional fields", async () => {
    const row = makeInspectionRow({
      odometer: 50000,
      fuel_level: 75,
      technician_notes: "Customer reported noise",
    });
    db.__qb.resolveOnce({ data: row, error: null });

    const result = await createInspection(db, ORG_ID, USER_ID, {
      vehicle_id: VEHICLE_ID,
      odometer: 50000,
      fuel_level: 75,
      technician_notes: "Customer reported noise",
    });

    expect(result.odometer).toBe(50000);
    expect(result.fuel_level).toBe(75);
    expect(result.technician_notes).toBe("Customer reported noise");
    expect(db.from("digital_vehicle_inspections").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        odometer: 50000,
        fuel_level: 75,
        technician_notes: "Customer reported noise",
      }),
    );
  });

  it("throws ValidationError for empty vehicle_id", async () => {
    await expect(
      createInspection(db, ORG_ID, USER_ID, { vehicle_id: "" }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for whitespace-only vehicle_id", async () => {
    await expect(
      createInspection(db, ORG_ID, USER_ID, { vehicle_id: "   " }),
    ).rejects.toThrow(ValidationError);
  });

  it("handles db error", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("Insert failed") });

    await expect(
      createInspection(db, ORG_ID, USER_ID, validParams),
    ).rejects.toThrow("Insert failed");
    expect(mockReportServerError).toHaveBeenCalledWith(
      "createInspection",
      expect.any(Error),
    );
  });
});

// ── updateInspection ──────────────────────────────────────────────

describe("updateInspection", () => {
  it("updates inspection fields", async () => {
    // 1) existing check
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    // 2) update + select
    db.__qb.resolveOnce({
      data: makeInspectionRow({ technician_notes: "Updated notes" }),
      error: null,
    });

    const result = await updateInspection(
      db,
      INSPECTION_ID,
      ORG_ID,
      USER_ID,
      { technician_notes: "Updated notes" },
    );

    expect(result.technician_notes).toBe("Updated notes");
    expect(
      db.from("digital_vehicle_inspections").update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ technician_notes: "Updated notes" }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("updates multiple fields", async () => {
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    db.__qb.resolveOnce({
      data: makeInspectionRow({
        odometer: 60000,
        fuel_level: 50,
        status: "sent",
      }),
      error: null,
    });

    const result = await updateInspection(
      db,
      INSPECTION_ID,
      ORG_ID,
      USER_ID,
      { odometer: 60000, fuel_level: 50, status: "sent" },
    );

    expect(result.odometer).toBe(60000);
    expect(result.fuel_level).toBe(50);
    expect(result.status).toBe("sent");
  });

  it("throws NotFoundError for missing inspection", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      updateInspection(db, "nonexistent", ORG_ID, USER_ID, {
        technician_notes: "test",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── addInspectionItem ─────────────────────────────────────────────

describe("addInspectionItem", () => {
  const validParams = {
    category: "safety",
    item_name: "Brake pads",
  };

  it("adds item successfully", async () => {
    // 1) existing check
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    // 2) insert
    db.__qb.resolveOnce({ data: makeItemRow(), error: null });

    const result = await addInspectionItem(
      db,
      INSPECTION_ID,
      ORG_ID,
      USER_ID,
      validParams,
    );

    expect(result.id).toBe(ITEM_ID);
    expect(result.category).toBe("safety");
    expect(result.item_name).toBe("Brake pads");
    expect(result.inspection_id).toBe(INSPECTION_ID);
    expect(db.from("dvi_inspection_items").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        inspection_id: INSPECTION_ID,
        category: "safety",
        item_name: "Brake pads",
      }),
    );
  });

  it("adds item with optional fields", async () => {
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    db.__qb.resolveOnce({
      data: makeItemRow({
        condition: "poor",
        severity: "critical",
        notes: "Needs immediate replacement",
      }),
      error: null,
    });

    const result = await addInspectionItem(
      db,
      INSPECTION_ID,
      ORG_ID,
      USER_ID,
      {
        category: "brakes",
        item_name: "Brake discs",
        condition: "poor",
        severity: "critical",
        notes: "Needs immediate replacement",
      },
    );

    expect(result.condition).toBe("poor");
    expect(result.severity).toBe("critical");
    expect(result.notes).toBe("Needs immediate replacement");
  });

  it("throws ValidationError for empty category", async () => {
    // Existence check must pass before validation
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });

    await expect(
      addInspectionItem(db, INSPECTION_ID, ORG_ID, USER_ID, {
        category: "",
        item_name: "Brake pads",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for empty item_name", async () => {
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });

    await expect(
      addInspectionItem(db, INSPECTION_ID, ORG_ID, USER_ID, {
        category: "safety",
        item_name: "",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for whitespace-only item_name", async () => {
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });

    await expect(
      addInspectionItem(db, INSPECTION_ID, ORG_ID, USER_ID, {
        category: "safety",
        item_name: "   ",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError for bad inspection", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      addInspectionItem(db, "nonexistent", ORG_ID, USER_ID, validParams),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── updateInspectionItem ──────────────────────────────────────────

describe("updateInspectionItem", () => {
  it("updates item fields", async () => {
    // 1) existing inspection check
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    // 2) update item
    db.__qb.resolveOnce({
      data: makeItemRow({ notes: "Updated notes" }),
      error: null,
    });

    const result = await updateInspectionItem(
      db,
      INSPECTION_ID,
      ITEM_ID,
      ORG_ID,
      USER_ID,
      { notes: "Updated notes" },
    );

    expect(result.notes).toBe("Updated notes");
    expect(
      db.from("dvi_inspection_items").update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "Updated notes" }),
    );
  });

  it("updates item with null value", async () => {
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    db.__qb.resolveOnce({
      data: makeItemRow({ condition: null }),
      error: null,
    });

    const result = await updateInspectionItem(
      db,
      INSPECTION_ID,
      ITEM_ID,
      ORG_ID,
      USER_ID,
      { condition: null },
    );

    expect(result.condition).toBeNull();
  });
});

// ── removeInspectionItem ──────────────────────────────────────────

describe("removeInspectionItem", () => {
  it("removes item successfully", async () => {
    // 1) existing check
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    // 2) delete
    db.__qb.resolveOnce({ data: null, error: null });

    await removeInspectionItem(db, INSPECTION_ID, ITEM_ID, ORG_ID);

    expect(db.from("dvi_inspection_items").delete).toHaveBeenCalled();
    expect(db.from("dvi_inspection_items").eq).toHaveBeenCalledWith(
      "id",
      ITEM_ID,
    );
    expect(db.from("dvi_inspection_items").eq).toHaveBeenCalledWith(
      "inspection_id",
      INSPECTION_ID,
    );
  });

  it("throws NotFoundError for bad inspection", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      removeInspectionItem(db, "nonexistent", ITEM_ID, ORG_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── sendInspectionToCustomer ──────────────────────────────────────

describe("sendInspectionToCustomer", () => {
  it("generates token and updates inspection", async () => {
    // 1) existing check
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    // 2) update hash + status
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await sendInspectionToCustomer(
      db,
      INSPECTION_ID,
      ORG_ID,
      USER_ID,
      "99111111",
    );

    expect(result.token).toBeTruthy();
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBeGreaterThan(0);
    expect(
      db.from("digital_vehicle_inspections").update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "sent",
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError for missing inspection", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      sendInspectionToCustomer(db, "nonexistent", ORG_ID, USER_ID, "99111111"),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── submitCustomerApproval ────────────────────────────────────────

describe("submitCustomerApproval", () => {
  it("approves all items", async () => {
    // 1) find by token hash
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    // 2) update items
    db.__qb.resolveOnce({ data: null, error: null });
    // 3) count items — all approved
    db.__qb.resolveOnce({
      data: [
        { customer_approved: true },
        { customer_approved: true },
      ],
      error: null,
    });
    // 4) update inspection status
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await submitCustomerApproval(db, "test-token", {
      item_ids: [ITEM_ID],
      approved: true,
    });

    expect(result.status).toBe("approved");
    expect(result.approved_count).toBe(2);
    expect(result.declined_count).toBe(0);
  });

  it("declines all items", async () => {
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({
      data: [
        { customer_approved: false },
        { customer_approved: false },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await submitCustomerApproval(db, "test-token", {
      item_ids: [ITEM_ID],
      approved: false,
    });

    expect(result.status).toBe("declined");
    expect(result.approved_count).toBe(0);
    expect(result.declined_count).toBe(2);
  });

  it("handles partial approval (mix of approved, declined, unset)", async () => {
    db.__qb.resolveOnce({ data: { id: INSPECTION_ID }, error: null });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({
      data: [
        { customer_approved: true },
        { customer_approved: false },
        { customer_approved: null },
      ],
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await submitCustomerApproval(db, "test-token", {
      item_ids: [ITEM_ID],
      approved: true,
    });

    expect(result.status).toBe("partially_approved");
    expect(result.approved_count).toBe(1);
    expect(result.declined_count).toBe(1);
  });

  it("throws NotFoundError for invalid token", async () => {
    db.__qb.resolveOnce({ data: null, error: new Error("not found") });

    await expect(
      submitCustomerApproval(db, "bad-token", {
        item_ids: [ITEM_ID],
        approved: true,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ── convertInspectionToWorkOrder ──────────────────────────────────

describe("convertInspectionToWorkOrder", () => {
  it("converts inspection to work order", async () => {
    // 1) fetch inspection
    db.__qb.resolveOnce({
      data: {
        id: INSPECTION_ID,
        organization_id: ORG_ID,
        vehicle_id: VEHICLE_ID,
      },
      error: null,
    });
    // 2) create work order — db.from("work_orders").insert().select("id").single()
    db.__qb.resolveOnce({ data: { id: "wo-1" }, error: null });
    // 3) update inspection with work_order_id + status
    db.__qb.resolveOnce({ data: null, error: null });

    const result = await convertInspectionToWorkOrder(
      db,
      INSPECTION_ID,
      ORG_ID,
      USER_ID,
    );

    expect(result.work_order_id).toBe("wo-1");
    expect(db.from("work_orders").insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        vehicle_id: VEHICLE_ID,
        status: "New",
      }),
    );
    expect(
      db.from("digital_vehicle_inspections").update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: "wo-1",
        status: "converted",
      }),
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        table_name: "digital_vehicle_inspections",
        record_id: INSPECTION_ID,
        user_id: USER_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError for missing inspection", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      convertInspectionToWorkOrder(db, "nonexistent", ORG_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });
});
