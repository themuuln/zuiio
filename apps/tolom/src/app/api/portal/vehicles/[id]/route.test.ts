import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

describe("GET /api/portal/vehicles/[id]", () => {
  const customer = {
    id: "cust-1",
    first_name: "John",
    last_name: "Doe",
    phone: "123456",
    email: "john@test.com",
    organization_id: "org-1",
    portal_token: "tok-1",
    total_visits: 5,
    last_visit_at: null,
  };

  const vehicle = {
    id: "v1",
    plate_number: "ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    vin: "1HGCM82633A123456",
    color: "Blue",
    odometer: 50000,
    engine: "2.5L",
    fuel_type: "Gasoline",
    transmission: "Automatic",
    trim: null,
    drivetrain: null,
    body_type: null,
    license_expiry_at: null,
    next_service_at: "2024-12-01",
    last_visit_at: "2024-06-01",
    notes: null,
    created_at: "2023-01-01",
  };

  const workOrder = {
    id: "wo-1",
    vehicle_id: "v1",
    status: "completed",
    complaint: "Oil change",
    description: null,
    total: 12000,
    bay_number: null,
    mechanic_id: null,
    created_at: "2024-01-15",
    completed_at: "2024-01-15",
  };

  const schedule = {
    id: "sched-1",
    service_name: "Oil Change",
    interval_months: 6,
    interval_km: 10000,
    last_service_date: "2024-01-15",
    last_service_odometer: 50000,
    next_due_date: "2024-07-15",
    next_due_km: 60000,
    reminder_enabled: true,
    notes: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeSupabase(overrides: Record<string, unknown> = {}) {
    const defaults = {
      vehicleOwnersData: [{ vehicle_id: "v1" }, { vehicle_id: "v2" }],
      vehicleData: vehicle,
      vehicleError: null,
      workOrdersData: [workOrder],
      workOrdersError: null,
      servicesData: [],
      servicesError: null,
      partsData: [],
      partsError: null,
      schedulesData: [schedule],
    };
    const cfg = { ...defaults, ...overrides };

    return {
      from: vi.fn((table: string) => {
        if (table === "vehicle_owners") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({
              data: cfg.vehicleOwnersData,
              error: null,
            }),
          };
        }
        if (table === "vehicles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: cfg.vehicleData,
              error: cfg.vehicleError,
            }),
          };
        }
        if (table === "work_orders") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: cfg.workOrdersData,
              error: cfg.workOrdersError,
            }),
          };
        }
        if (table === "vehicle_service_schedules") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: cfg.schedulesData,
              error: null,
            }),
          };
        }
        if (table === "work_order_services") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: cfg.servicesData,
              error: cfg.servicesError,
            }),
          };
        }
        if (table === "work_order_parts") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: cfg.partsData,
              error: cfg.partsError,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };
  }

  it("returns vehicle with work orders and upcoming services", async () => {
    const supabase = makeSupabase();

    const req = new NextRequest(
      new URL("http://localhost/api/portal/vehicles/v1"),
    );
    const response = await GET({
      request: req,
      customer,
      supabase,
      params: { id: "v1" },
    });
    const body = await response.json();
    expect(body.data.vehicle).toBeDefined();
    expect(body.data.vehicle.plate_number).toBe("ABC123");
    expect(body.data.workOrders).toHaveLength(1);
    expect(body.data.workOrders[0].services).toEqual([]);
    expect(body.data.workOrders[0].parts).toEqual([]);
    expect(body.data.upcomingServices).toHaveLength(1);
    expect(body.data.upcomingServices[0].service_name).toBe("Oil Change");
  });

  it("throws NotFoundError when vehicle not in customer's owned list", async () => {
    const supabase = makeSupabase({
      vehicleOwnersData: [{ vehicle_id: "v2" }],
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/vehicles/v1"),
    );
    await expect(
      GET({ request: req, customer, supabase, params: { id: "v1" } }),
    ).rejects.toThrow("Vehicle not found");
  });

  it("throws NotFoundError when vehicle query returns null", async () => {
    const supabase = makeSupabase({
      vehicleData: null,
      vehicleError: null,
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/vehicles/v1"),
    );
    await expect(
      GET({ request: req, customer, supabase, params: { id: "v1" } }),
    ).rejects.toThrow("Vehicle not found");
  });
});
