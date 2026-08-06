import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  AppError: class extends Error {
    constructor(
      msg: string,
      public code: string,
      public status: number,
    ) {
      super(msg);
      this.name = "AppError";
    }
  },
  UnauthorizedError: class extends Error {
    constructor(msg = "Unauthorized") {
      super(msg);
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

import { revalidateTag } from "next/cache";
import { AppError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  type EnrichedServiceItem,
  getCompletionData,
  getRecommendations,
  getWorkOrderParts,
  getWorkOrderServicesWithIntervals,
  saveCompletionData,
  savePostServiceData,
} from "../post-service-service";

const mockCreateClient = vi.mocked(createClient);
const mockRevalidateTag = vi.mocked(revalidateTag);

const USER_ID = "test-user-id";
const ORG_ID = "org-1";

let db: MockSupabaseClient;

function mockOrgMembership(orgId: string | null = ORG_ID) {
  vi.mocked(db.from("organization_users").maybeSingle).mockResolvedValueOnce({
    data: orgId ? { organization_id: orgId } : null,
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
  mockCreateClient.mockResolvedValue(db as never);
});

// ── savePostServiceData ─────────────────────────────────────────

describe("savePostServiceData", () => {
  it("inserts recommendations, updates work order/vehicle/schedules and invalidates caches", async () => {
    mockOrgMembership();
    vi.mocked(db.from("vehicles").maybeSingle).mockResolvedValueOnce({
      data: { odometer: 10000 },
      error: null,
    });
    vi.mocked(db.from("work_orders").maybeSingle).mockResolvedValueOnce({
      data: { customer_id: "cust-1" },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // delete old recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // delete pending reminder logs
    db.__qb.resolveOnce({ data: null, error: null }); // insert recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // update work order
    db.__qb.resolveOnce({ data: null, error: null }); // update vehicle odometer
    db.__qb.resolveOnce({
      data: [{ id: "sched-1", service_name: "Oil Change" }],
      error: null,
    }); // select existing schedules
    db.__qb.resolveOnce({ data: null, error: null }); // update sched-1
    db.__qb.resolveOnce({ data: null, error: null }); // insert reminder log
    db.__qb.resolveOnce({ data: null, error: null }); // insert tire rotation schedule

    const result = await savePostServiceData({
      workOrderId: "wo-1",
      vehicleId: "veh-1",
      odometerReading: 50000,
      mechanicNotes: "  Done  ",
      recommendations: [
        {
          workOrderServiceId: "wos-1",
          serviceName: "Oil Change",
          serviceCatalogId: "cat-1",
          intervalMonths: 6,
          intervalKm: 5000,
          priority: "urgent",
          notes: "  check filter  ",
        },
        {
          workOrderServiceId: "wos-2",
          serviceName: "Tire Rotation",
          intervalKm: 10000,
          priority: "standard",
        },
      ],
    });

    expect(result).toEqual({ recommendationsCount: 2 });

    const qb = db.from("service_recommendations");
    expect(qb.delete).toHaveBeenCalledTimes(2);
    expect(qb.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          organization_id: ORG_ID,
          work_order_id: "wo-1",
          work_order_service_id: "wos-1",
          service_name: "Oil Change",
          service_catalog_id: "cat-1",
          recommended_interval_months: 6,
          recommended_interval_km: 5000,
          next_due_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          next_due_km: 55000,
          priority: "urgent",
          notes: "check filter",
          created_by: USER_ID,
          updated_by: USER_ID,
        }),
        expect.objectContaining({
          work_order_service_id: "wos-2",
          service_name: "Tire Rotation",
          service_catalog_id: null,
          recommended_interval_months: null,
          recommended_interval_km: 10000,
          next_due_date: null,
          next_due_km: 60000,
          priority: "standard",
          notes: null,
        }),
      ]),
    );
    expect(qb.update).toHaveBeenCalledWith({
      odometer_at_service: 50000,
      updated_by: USER_ID,
      notes: "Done",
    });
    expect(qb.update).toHaveBeenCalledWith({ odometer: 50000 });
    expect(qb.update).toHaveBeenCalledWith(
      expect.objectContaining({
        interval_months: 6,
        interval_km: 5000,
        next_due_km: 55000,
        updated_by: USER_ID,
      }),
    );
    expect(qb.eq).toHaveBeenCalledWith("id", "sched-1");
    expect(qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        vehicle_id: "veh-1",
        service_name: "Tire Rotation",
        interval_km: 10000,
        last_service_odometer: 50000,
        next_due_km: 60000,
        reminder_enabled: true,
        created_by: USER_ID,
        updated_by: USER_ID,
      }),
    );
    expect(qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        vehicle_id: "veh-1",
        customer_id: "cust-1",
        service_catalog_id: "cat-1",
        service_name: "Oil Change",
        reminder_type: "service_due",
        channel: "in_app",
        status: "pending",
        scheduled_at: expect.any(String),
      }),
    );

    expect(mockRevalidateTag).toHaveBeenCalledWith("work-order:wo-1", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("work-orders:org-1", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "service-schedules:org-1",
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
  });

  it("no-ops recommendations when the list is empty but still updates the work order", async () => {
    mockOrgMembership();
    db.__qb.resolveOnce({ data: null, error: null }); // delete old recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // update work order

    const result = await savePostServiceData({
      workOrderId: "wo-1",
      vehicleId: "veh-1",
      recommendations: [],
    });

    expect(result).toEqual({ recommendationsCount: 0 });
    const qb = db.from("work_orders");
    expect(qb.insert).not.toHaveBeenCalled();
    expect(qb.update).toHaveBeenCalledWith({
      odometer_at_service: null,
      updated_by: USER_ID,
    });
    expect(qb.update).toHaveBeenCalledTimes(1);
    expect(db.from).not.toHaveBeenCalledWith("reminder_logs");
    expect(db.from).not.toHaveBeenCalledWith("vehicle_service_schedules");
    expect(db.from).not.toHaveBeenCalledWith("vehicles");
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
  });

  it("throws UnauthorizedError when there is no session user", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(
      savePostServiceData({
        workOrderId: "wo-1",
        vehicleId: "veh-1",
        recommendations: [],
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("throws ValidationError when workOrderId is missing", async () => {
    mockOrgMembership();

    const promise = savePostServiceData({
      workOrderId: "",
      vehicleId: "veh-1",
      recommendations: [],
    });

    await expect(promise).rejects.toThrow(ValidationError);
    await expect(promise).rejects.toThrow("Work order ID is required");
  });

  it("throws ValidationError when no organization membership exists", async () => {
    mockOrgMembership(null);

    await expect(
      savePostServiceData({
        workOrderId: "wo-1",
        vehicleId: "veh-1",
        recommendations: [],
      }),
    ).rejects.toThrow("Organization not found");
  });

  it("throws AppError when clearing old recommendations fails", async () => {
    mockOrgMembership();
    db.__qb.resolveOnce({
      data: null,
      error: new Error("delete failed"),
    });

    const promise = savePostServiceData({
      workOrderId: "wo-1",
      vehicleId: "veh-1",
      recommendations: [],
    });

    await expect(promise).rejects.toThrow(AppError);
    await expect(promise).rejects.toThrow(
      "Failed to clear old recommendations: delete failed",
    );
  });

  it("throws AppError when inserting recommendations fails", async () => {
    mockOrgMembership();
    db.__qb.resolveOnce({ data: null, error: null }); // delete old recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // delete reminder logs
    db.__qb.resolveOnce({
      data: null,
      error: new Error("insert failed"),
    }); // insert recommendations

    await expect(
      savePostServiceData({
        workOrderId: "wo-1",
        vehicleId: "veh-1",
        recommendations: [
          {
            workOrderServiceId: "wos-1",
            serviceName: "Oil Change",
            priority: "standard",
          },
        ],
      }),
    ).rejects.toThrow("Failed to save recommendations: insert failed");
  });

  it("throws AppError when updating the work order fails", async () => {
    mockOrgMembership();
    db.__qb.resolveOnce({ data: null, error: null }); // delete old recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // delete reminder logs
    db.__qb.resolveOnce({ data: null, error: null }); // insert recommendations
    db.__qb.resolveOnce({
      data: null,
      error: new Error("update failed"),
    }); // update work order

    await expect(
      savePostServiceData({
        workOrderId: "wo-1",
        vehicleId: "veh-1",
        recommendations: [
          {
            workOrderServiceId: "wos-1",
            serviceName: "Oil Change",
            priority: "standard",
          },
        ],
      }),
    ).rejects.toThrow("Failed to update work order: update failed");
  });

  it("does not update vehicle odometer when the existing reading is higher", async () => {
    mockOrgMembership();
    vi.mocked(db.from("vehicles").maybeSingle).mockResolvedValueOnce({
      data: { odometer: 60000 },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // delete old recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // delete reminder logs
    db.__qb.resolveOnce({ data: null, error: null }); // insert recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // update work order

    const result = await savePostServiceData({
      workOrderId: "wo-1",
      vehicleId: "veh-1",
      odometerReading: 50000,
      recommendations: [
        {
          workOrderServiceId: "wos-1",
          serviceName: "Oil Change",
          priority: "standard",
        },
      ],
    });

    expect(result).toEqual({ recommendationsCount: 1 });
    const qb = db.from("work_orders");
    expect(qb.update).toHaveBeenCalledTimes(1); // only the work order update
    expect(qb.insert).not.toHaveBeenCalledWith(
      expect.objectContaining({ service_name: "Oil Change" }),
    ); // no schedule/reminder created without intervals
    expect(db.from).not.toHaveBeenCalledWith("vehicle_service_schedules");
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
  });

  it("creates a new schedule when none exists and skips the vehicle update when the vehicle has no odometer record", async () => {
    mockOrgMembership();
    vi.mocked(db.from("vehicles").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: null,
    });
    vi.mocked(db.from("work_orders").maybeSingle).mockResolvedValueOnce({
      data: { customer_id: "cust-1" },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // delete old recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // delete reminder logs
    db.__qb.resolveOnce({ data: null, error: null }); // insert recommendations
    db.__qb.resolveOnce({ data: null, error: null }); // update work order
    db.__qb.resolveOnce({ data: null, error: null }); // select existing schedules (none)
    db.__qb.resolveOnce({ data: null, error: null }); // insert schedule
    db.__qb.resolveOnce({ data: null, error: null }); // insert reminder log

    await savePostServiceData({
      workOrderId: "wo-1",
      vehicleId: "veh-1",
      odometerReading: 50000,
      recommendations: [
        {
          workOrderServiceId: "wos-1",
          serviceName: "Oil Change",
          intervalMonths: 6,
          priority: "standard",
        },
      ],
    });

    const qb = db.from("work_orders");
    expect(qb.update).toHaveBeenCalledTimes(1); // no vehicle update without a record
    expect(qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        vehicle_id: "veh-1",
        service_name: "Oil Change",
        interval_months: 6,
        last_service_odometer: 50000,
        reminder_enabled: true,
      }),
    );
    expect(qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        service_name: "Oil Change",
        reminder_type: "service_due",
        channel: "in_app",
        status: "pending",
      }),
    );
  });
});

// ── saveCompletionData ──────────────────────────────────────────

describe("saveCompletionData", () => {
  it("inserts completion data, updates visits and logs communication on first completion", async () => {
    mockOrgMembership();
    vi.mocked(
      db.from("service_completion_data").maybeSingle,
    ).mockResolvedValueOnce({ data: null, error: null });
    vi.mocked(db.from("work_orders").maybeSingle).mockResolvedValueOnce({
      data: { customer_id: "cust-1" },
      error: null,
    });
    vi.mocked(db.from("customers").maybeSingle).mockResolvedValueOnce({
      data: { total_visits: 3 },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // insert completion data
    db.__qb.resolveOnce({ data: null, error: null }); // update vehicle last_visit_at
    db.__qb.resolveOnce({ data: null, error: null }); // update customer total_visits
    db.__qb.resolveOnce({ data: null, error: null }); // insert communication record

    await saveCompletionData({
      workOrderId: "wo-1",
      vehicleId: "veh-1",
      odometerReading: 50000,
      customerSatisfaction: 5,
      customerFeedback: "  Great job  ",
      nextAppointmentDate: "2026-09-01",
    });

    const qb = db.from("service_completion_data");
    expect(qb.insert).toHaveBeenCalledWith({
      organization_id: ORG_ID,
      work_order_id: "wo-1",
      vehicle_id: "veh-1",
      odometer_reading: 50000,
      customer_satisfaction: 5,
      customer_feedback: "Great job",
      customer_preferences: {},
      next_appointment_date: "2026-09-01",
      created_by: USER_ID,
    });
    expect(qb.update).toHaveBeenCalledWith({
      last_visit_at: expect.any(String),
    });
    expect(qb.update).toHaveBeenCalledWith({
      last_visit_at: expect.any(String),
      total_visits: 4,
    });
    expect(qb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        customer_id: "cust-1",
        type: "in_person",
        direction: "outbound",
        subject: "Service Completed",
        staff_id: USER_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith("work-order:wo-1", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("work-orders:org-1", "max");
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("updates existing completion data without double-counting visits", async () => {
    mockOrgMembership();
    vi.mocked(
      db.from("service_completion_data").maybeSingle,
    ).mockResolvedValueOnce({ data: { id: "comp-1" }, error: null });
    vi.mocked(db.from("work_orders").maybeSingle).mockResolvedValueOnce({
      data: { customer_id: "cust-1" },
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // update completion data
    db.__qb.resolveOnce({ data: null, error: null }); // update vehicle last_visit_at
    db.__qb.resolveOnce({ data: null, error: null }); // update customer last_visit_at only

    await saveCompletionData({
      workOrderId: "wo-1",
      vehicleId: "veh-1",
      nextAppointmentDate: "2026-10-01",
    });

    const qb = db.from("service_completion_data");
    expect(qb.update).toHaveBeenCalledWith({
      odometer_reading: null,
      customer_satisfaction: null,
      customer_feedback: null,
      next_appointment_date: "2026-10-01",
    });
    expect(qb.eq).toHaveBeenCalledWith("id", "comp-1");
    expect(qb.update).toHaveBeenCalledWith({
      last_visit_at: expect.any(String),
    });
    expect(qb.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ total_visits: expect.any(Number) }),
    );
    expect(qb.insert).not.toHaveBeenCalled();
  });

  it("skips customer bookkeeping when the work order has no customer", async () => {
    mockOrgMembership();
    vi.mocked(
      db.from("service_completion_data").maybeSingle,
    ).mockResolvedValueOnce({ data: null, error: null });
    vi.mocked(db.from("work_orders").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null }); // insert completion data
    db.__qb.resolveOnce({ data: null, error: null }); // update vehicle last_visit_at

    await saveCompletionData({ workOrderId: "wo-1", vehicleId: "veh-1" });

    const qb = db.from("work_orders");
    expect(qb.update).toHaveBeenCalledTimes(1); // vehicles only
    expect(db.from).not.toHaveBeenCalledWith("customers");
    expect(db.from).not.toHaveBeenCalledWith("customer_communications");
  });

  it("throws AppError when inserting completion data fails", async () => {
    mockOrgMembership();
    vi.mocked(
      db.from("service_completion_data").maybeSingle,
    ).mockResolvedValueOnce({ data: null, error: null });
    vi.mocked(db.from("work_orders").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: null,
    });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("insert failed"),
    });

    await expect(
      saveCompletionData({ workOrderId: "wo-1", vehicleId: "veh-1" }),
    ).rejects.toThrow("Failed to save completion data: insert failed");
  });

  it("throws AppError when updating existing completion data fails", async () => {
    mockOrgMembership();
    vi.mocked(
      db.from("service_completion_data").maybeSingle,
    ).mockResolvedValueOnce({ data: { id: "comp-1" }, error: null });
    vi.mocked(db.from("work_orders").maybeSingle).mockResolvedValueOnce({
      data: null,
      error: null,
    });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("update failed"),
    });

    await expect(
      saveCompletionData({ workOrderId: "wo-1", vehicleId: "veh-1" }),
    ).rejects.toThrow("Failed to update completion data: update failed");
  });

  it("throws UnauthorizedError when there is no session user", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(
      saveCompletionData({ workOrderId: "wo-1", vehicleId: "veh-1" }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

// ── getWorkOrderServicesWithIntervals ───────────────────────────

describe("getWorkOrderServicesWithIntervals", () => {
  it("enriches services with catalog intervals from the joined array", async () => {
    mockOrgMembership();
    db.__qb.resolveWith({
      data: [
        {
          id: "s1",
          service_name: "Oil Change",
          service_catalog_id: "cat-1",
          service_catalog: [{ interval_months: 6, interval_km: 5000 }],
        },
        {
          id: "s2",
          service_name: "Brakes",
          service_catalog_id: null,
          service_catalog: null,
        },
      ],
      error: null,
    });

    const result: EnrichedServiceItem[] =
      await getWorkOrderServicesWithIntervals("wo-1");

    expect(result).toEqual([
      {
        id: "s1",
        service_name: "Oil Change",
        service_catalog_id: "cat-1",
        catalog_interval_months: 6,
        catalog_interval_km: 5000,
      },
      {
        id: "s2",
        service_name: "Brakes",
        service_catalog_id: null,
        catalog_interval_months: null,
        catalog_interval_km: null,
      },
    ]);
  });

  it("handles a non-array service_catalog join", async () => {
    mockOrgMembership();
    db.__qb.resolveWith({
      data: [
        {
          id: "s1",
          service_name: "Oil Change",
          service_catalog_id: "cat-1",
          service_catalog: { interval_months: 3, interval_km: null },
        },
      ],
      error: null,
    });

    const result = await getWorkOrderServicesWithIntervals("wo-1");

    expect(result[0]).toEqual({
      id: "s1",
      service_name: "Oil Change",
      service_catalog_id: "cat-1",
      catalog_interval_months: 3,
      catalog_interval_km: null,
    });
  });

  it("returns an empty array when no services exist", async () => {
    mockOrgMembership();
    db.__qb.resolveWith({ data: [], error: null });

    await expect(getWorkOrderServicesWithIntervals("wo-1")).resolves.toEqual(
      [],
    );
  });

  it("throws AppError when the query fails", async () => {
    mockOrgMembership();
    db.__qb.resolveWith({ data: null, error: new Error("db down") });

    await expect(getWorkOrderServicesWithIntervals("wo-1")).rejects.toThrow(
      "Failed to fetch services: db down",
    );
  });

  it("throws UnauthorizedError when there is no session user", async () => {
    vi.mocked(db.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(getWorkOrderServicesWithIntervals("wo-1")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("throws ValidationError when the org cannot be resolved", async () => {
    mockOrgMembership(null);

    await expect(getWorkOrderServicesWithIntervals("wo-1")).rejects.toThrow(
      "Organization not found",
    );
  });
});

// ── getWorkOrderParts ───────────────────────────────────────────

describe("getWorkOrderParts", () => {
  it("returns parts with numeric prices", async () => {
    mockOrgMembership();
    db.__qb.resolveWith({
      data: [
        {
          id: "p1",
          part_name: "Oil Filter",
          part_number: "OF-1",
          quantity: 2,
          unit_price: "12.5",
          final_price: "25",
        },
        {
          id: "p2",
          part_name: "Brake Pads",
          part_number: null,
          quantity: 1,
          unit_price: 40,
          final_price: 40,
        },
      ],
      error: null,
    });

    const result = await getWorkOrderParts("wo-1");

    expect(result).toEqual([
      {
        id: "p1",
        part_name: "Oil Filter",
        part_number: "OF-1",
        quantity: 2,
        unit_price: 12.5,
        final_price: 25,
      },
      {
        id: "p2",
        part_name: "Brake Pads",
        part_number: null,
        quantity: 1,
        unit_price: 40,
        final_price: 40,
      },
    ]);
  });

  it("returns an empty array when no parts exist", async () => {
    mockOrgMembership();
    db.__qb.resolveWith({ data: [], error: null });

    await expect(getWorkOrderParts("wo-1")).resolves.toEqual([]);
  });

  it("throws AppError when the query fails", async () => {
    mockOrgMembership();
    db.__qb.resolveWith({ data: null, error: new Error("db down") });

    await expect(getWorkOrderParts("wo-1")).rejects.toThrow(
      "Failed to fetch parts: db down",
    );
  });
});

// ── getRecommendations ──────────────────────────────────────────

describe("getRecommendations", () => {
  it("returns recommendations ordered by priority", async () => {
    db.__qb.resolveWith({
      data: [
        {
          id: "r1",
          work_order_id: "wo-1",
          service_name: "Oil Change",
          priority: "standard",
          deleted_at: null,
        },
      ],
      error: null,
    });

    const result = await getRecommendations("wo-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "r1",
      service_name: "Oil Change",
      priority: "standard",
    });
    expect(db.from("service_recommendations").order).toHaveBeenCalledWith(
      "priority",
      { ascending: true },
    );
  });

  it("returns an empty array when no recommendations exist", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    await expect(getRecommendations("wo-1")).resolves.toEqual([]);
  });

  it("throws AppError when the query fails", async () => {
    db.__qb.resolveWith({ data: null, error: new Error("db down") });

    await expect(getRecommendations("wo-1")).rejects.toThrow(
      "Failed to fetch recommendations: db down",
    );
  });
});

// ── getCompletionData ───────────────────────────────────────────

describe("getCompletionData", () => {
  it("returns completion data when present", async () => {
    vi.mocked(
      db.from("service_completion_data").maybeSingle,
    ).mockResolvedValueOnce({
      data: {
        id: "c1",
        work_order_id: "wo-1",
        odometer_reading: 50000,
        customer_satisfaction: 5,
      },
      error: null,
    });

    const result = await getCompletionData("wo-1");

    expect(result).toMatchObject({
      id: "c1",
      odometer_reading: 50000,
      customer_satisfaction: 5,
    });
  });

  it("returns null when no completion data exists", async () => {
    await expect(getCompletionData("wo-1")).resolves.toBeNull();
  });

  it("throws AppError when the query fails", async () => {
    vi.mocked(
      db.from("service_completion_data").maybeSingle,
    ).mockResolvedValueOnce({ data: null, error: new Error("db down") });

    await expect(getCompletionData("wo-1")).rejects.toThrow(
      "Failed to fetch completion data: db down",
    );
  });
});
