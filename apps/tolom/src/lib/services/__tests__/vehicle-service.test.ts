import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  ConflictError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ConflictError";
    }
  },
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
vi.mock("@/lib/supabase/with-branch", () => ({
  resolveBranchId: vi.fn().mockResolvedValue("branch-1"),
  withBranchFilter: vi.fn((q: unknown) => q),
}));
vi.mock("../vehicle-models-service", () => ({
  ensureVehicleModel: vi.fn().mockResolvedValue(undefined),
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { resolveBranchId } from "@/lib/supabase/with-branch";
import { ensureVehicleModel } from "../vehicle-models-service";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);
const mockResolveBranchId = vi.mocked(resolveBranchId);
const mockEnsureVehicleModel = vi.mocked(ensureVehicleModel);

import {
  createVehicle,
  getCustomerVehicles,
  getCustomerWorkOrders,
  getVehicle,
  getVehicleServiceHistory,
  getVehicles,
  getVehiclesFast,
} from "../vehicle-service";

const ORG_ID = "org-1";
const VEHICLE_ID = "veh-1";
const USER_ID = "user-1";
const CUST_ID = "cust-1";

let db: ReturnType<typeof createMockSupabaseClient>;
beforeEach(() => {
  vi.resetAllMocks();
  mockResolveBranchId.mockResolvedValue("branch-1");
  mockEnsureVehicleModel.mockResolvedValue(undefined);
  db = createMockSupabaseClient();
});

function makeVehicleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: VEHICLE_ID,
    organization_id: ORG_ID,
    plate_number: "0001УБА",
    vin: "JTDBE32K600",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    color: "White",
    branch_id: null,
    created_at: "2025-01-15T10:00:00Z",
    deleted_at: null,
    vehicle_owners: [
      {
        customer_id: CUST_ID,
        customers: { first_name: "John", last_name: "Doe", phone: "99112233" },
      },
    ],
    ...overrides,
  };
}

const createParams = {
  plateNumber: "0001УБА",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  color: "White",
  customerId: CUST_ID,
  branchId: "branch-1",
};

// ── getVehicles ──────────────────────────────────────────────────

describe("getVehicles", () => {
  it("returns vehicles with owner name and phone", async () => {
    db.__qb.resolveWith({ data: [makeVehicleRow()], error: null });
    const r = await getVehicles(db as never, ORG_ID);
    expect(r).toHaveLength(1);
    expect(r[0].owner_name).toBe("John Doe");
    expect(r[0].owner_phone).toBe("99112233");
  });

  it("returns null owner_name when no owners", async () => {
    db.__qb.resolveWith({
      data: [makeVehicleRow({ vehicle_owners: [] })],
      error: null,
    });
    const r = await getVehicles(db as never, ORG_ID);
    expect(r[0].owner_name).toBeNull();
  });

  it("throws on DB error", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("fail") });
    await expect(getVehicles(db as never, ORG_ID)).rejects.toThrow("fail");
  });
});

// ── getVehiclesFast ──────────────────────────────────────────────

describe("getVehiclesFast", () => {
  const rpcRow = {
    id: VEHICLE_ID,
    plate_number: "0001УБА",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    color: "White",
    vin: "JTDBE32K600",
    created_at: "2025-01-15T10:00:00Z",
    customer: { full_name: "John Doe", phone: "99112233" },
    work_orders_count: 3,
  };

  it("returns mapped rows with owner_name", async () => {
    db.rpc.mockResolvedValue({ data: [rpcRow], error: null });
    const r = await getVehiclesFast(db as never, ORG_ID);
    expect(r).toHaveLength(1);
    expect(r[0].owner_name).toBe("John Doe");
  });

  it("passes params to RPC including p_offset", async () => {
    db.rpc.mockResolvedValue({ data: [rpcRow], error: null });
    await getVehiclesFast(db as never, ORG_ID, { search: "0001", limit: 25 });
    expect(db.rpc).toHaveBeenCalledWith("get_vehicles_list", {
      p_org_id: ORG_ID,
      p_search: "0001",
      p_limit: 25,
      p_offset: 0,
    });
  });

  it("throws on RPC error", async () => {
    db.rpc.mockResolvedValue({ data: null, error: new Error("RPC fail") });
    await expect(getVehiclesFast(db as never, ORG_ID)).rejects.toThrow(
      "RPC fail",
    );
  });

  it("handles null customer", async () => {
    db.rpc.mockResolvedValue({
      data: [{ ...rpcRow, customer: null }],
      error: null,
    });
    const r = await getVehiclesFast(db as never, ORG_ID);
    expect(r[0].owner_name).toBeNull();
  });
});

// ── getVehicle ───────────────────────────────────────────────────

describe("getVehicle", () => {
  it("returns detail with owners and recent work orders", async () => {
    // 1) vehicle query with .single() → consumes resolveOnce
    db.__qb.resolveOnce({ data: makeVehicleRow(), error: null });
    // 2) Promise.all([owners, workOrders]) — each needs qb.then
    db.__qb.resolveOnce({
      data: [
        {
          customer_id: CUST_ID,
          is_primary: true,
          customers: {
            first_name: "John",
            last_name: "Doe",
            phone: "99112233",
          },
        },
      ],
      error: null,
    });
    db.__qb.resolveOnce({
      data: [
        {
          id: "wo-1",
          status: "Completed",
          complaint: "Noise",
          total: 100,
          created_at: "2025-01-15T10:00:00Z",
        },
      ],
      error: null,
    });

    const r = await getVehicle(db as never, VEHICLE_ID, ORG_ID);
    expect(r.id).toBe(VEHICLE_ID);
    expect(r.owners).toHaveLength(1);
    expect(r.owners[0].name).toBe("John Doe");
    expect(r.recent_work_orders).toHaveLength(1);
  });

  it("throws NotFound when vehicle missing", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    await expect(getVehicle(db as never, "x", ORG_ID)).rejects.toThrow(
      "not found",
    );
  });
});

// ── createVehicle ────────────────────────────────────────────────

describe("createVehicle", () => {
  beforeEach(() => {
    db.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("creates vehicle, links owner, ensures model, audit, cache", async () => {
    // Duplicate check uses maybeSingle (built-in) — no resolveOnce consumed
    // Insert with .single() → consumes resolveOnce #1
    db.__qb.resolveOnce({
      data: {
        id: VEHICLE_ID,
        organization_id: ORG_ID,
        plate_number: "0001УБА",
        make: "Toyota",
      },
      error: null,
    });
    // Owner link insert → consumes resolveOnce #2
    db.__qb.resolveOnce({ data: null, error: null });

    const r = await createVehicle(db as never, ORG_ID, createParams, USER_ID);
    expect(r).toBeDefined();
    expect(mockEnsureVehicleModel).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws ConflictError on duplicate plate (maybeSingle returns existing)", async () => {
    // Override maybeSingle on the qb
    const q = db.from("vehicles").select("id, plate_number") as any;
    q.maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "existing", plate_number: "0001УБА" },
      error: null,
    });

    await expect(
      createVehicle(db as never, ORG_ID, createParams, USER_ID),
    ).rejects.toThrow("already exists");
  });

  it("rejects empty plate", async () => {
    await expect(
      createVehicle(
        db as never,
        ORG_ID,
        { ...createParams, plateNumber: "" },
        USER_ID,
      ),
    ).rejects.toThrow("Plate number is required");
  });

  it("skips owner link when no customerId", async () => {
    db.__qb.resolveOnce({
      data: {
        id: VEHICLE_ID,
        organization_id: ORG_ID,
        plate_number: "0001УБА",
      },
      error: null,
    });

    const r = await createVehicle(
      db as never,
      ORG_ID,
      { ...createParams, customerId: undefined } as never,
      USER_ID,
    );
    expect(r).toBeDefined();
  });
});

// ── getVehicleServiceHistory ─────────────────────────────────────

describe("getVehicleServiceHistory", () => {
  it("returns service history array", async () => {
    db.__qb.resolveWith({
      data: [
        {
          id: "wo-1",
          status: "Completed",
          created_at: "2025-01-15T10:00:00Z",
          work_order_services: [],
          work_order_parts: [],
        },
      ],
      error: null,
    });
    const r = await getVehicleServiceHistory(db as never, ORG_ID, VEHICLE_ID);
    expect(r).toHaveLength(1);
  });
});

// ── getCustomerVehicles ──────────────────────────────────────────

describe("getCustomerVehicles", () => {
  it("returns vehicles for customer", async () => {
    db.__qb.resolveWith({ data: [makeVehicleRow()], error: null });
    const r = await getCustomerVehicles(db as never, ORG_ID, CUST_ID);
    expect(r).toHaveLength(1);
  });
});

// ── getCustomerWorkOrders ────────────────────────────────────────

describe("getCustomerWorkOrders", () => {
  it("returns work orders for customer's vehicles", async () => {
    db.__qb.resolveWith({
      data: [
        {
          id: "wo-1",
          status: "In Progress",
          vehicle: { plate_number: "0001УБА", make: "Toyota", model: "Camry" },
          work_order_services: [],
        },
      ],
      error: null,
    });
    const r = await getCustomerWorkOrders(db as never, ORG_ID, CUST_ID);
    expect(r).toHaveLength(1);
  });
});
