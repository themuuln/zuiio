import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

function mockDb(tables: Record<string, unknown>) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => builder),
    maybeSingle: vi.fn(() => builder),
    then: undefined as unknown,
  };

  return {
    from: vi.fn((table: string) => {
      const value = tables[table as keyof typeof tables];
      if (value !== undefined) {
        builder.then = (resolve: (v: unknown) => unknown) =>
          Promise.resolve(value).then(resolve);
        // Reset chained methods to return builder
        for (const m of [
          "select",
          "eq",
          "in",
          "is",
          "order",
          "single",
          "maybeSingle",
        ]) {
          (builder as Record<string, unknown>)[m] = vi.fn(() => builder);
        }
      }
      return builder;
    }),
  };
}

describe("GET /api/portal/inspections/[id]", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInspection = {
    id: "insp-1",
    vehicle_id: "v-1",
    status: "sent",
    organization_id: "org-1",
    created_at: "2026-07-30T10:00:00Z",
    updated_at: "2026-07-30T10:30:00Z",
    odometer: 50000,
    fuel_level: "1/2",
    technician_notes: "Found issues with brakes",
    created_by: "user-1",
    customer_token_hash: null,
    customer_viewed_at: null,
    customer_decision_at: null,
    work_order_id: null,
  };

  const mockVehicle = {
    id: "v-1",
    plate_number: "ABC123",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    vin: "1HGCM82633A123456",
    color: "White",
    odometer: 50000,
  };

  const mockItems = [
    {
      id: "item-1",
      inspection_id: "insp-1",
      category: "tires",
      item_name: "Tread depth",
      condition: "fair",
      severity: "recommend",
      estimated_cost: 150000,
      customer_approved: null,
      has_photo: true,
      photo_urls: ["photo-1.jpg"],
      technician_notes: "2mm remaining",
      sort_order: 1,
      measurement_value: 2,
      measurement_unit: "mm",
      recommended_service_id: null,
      recommended_part_ids: [],
      created_at: "2026-07-30T10:05:00Z",
    },
    {
      id: "item-2",
      inspection_id: "insp-1",
      category: "brakes",
      item_name: "Brake pads",
      condition: "poor",
      severity: "urgent",
      estimated_cost: 250000,
      customer_approved: null,
      has_photo: true,
      photo_urls: ["photo-2.jpg"],
      technician_notes: "Worn below minimum",
      sort_order: 2,
      measurement_value: null,
      measurement_unit: null,
      recommended_service_id: null,
      recommended_part_ids: [],
      created_at: "2026-07-30T10:06:00Z",
    },
  ];

  it("returns inspection detail with items", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [{ vehicle_id: "v-1", owned_until: null, is_primary: true }],
        error: null,
      },
      digital_vehicle_inspections: { data: mockInspection, error: null },
      vehicles: { data: mockVehicle, error: null },
      dvi_inspection_items: { data: mockItems, error: null },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/insp-1"),
    );
    const response = await GET({
      request: req,
      customer,
      supabase,
      params: { id: "insp-1" },
    });
    const body = await response.json();

    expect(body.data.id).toBe("insp-1");
    expect(body.data.vehicle.plate_number).toBe("ABC123");
    expect(body.data.items).toHaveLength(2);
    expect(body.data.estimated_total_cost).toBe(400000);
  });

  it("throws NotFoundError when inspection not found", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [{ vehicle_id: "v-1", owned_until: null, is_primary: true }],
        error: null,
      },
      digital_vehicle_inspections: {
        data: null,
        error: new Error("Not found"),
      },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/nonexistent"),
    );
    await expect(
      GET({ request: req, customer, supabase, params: { id: "nonexistent" } }),
    ).rejects.toThrow("Inspection not found");
  });

  it("throws NotFoundError when inspection belongs to another customer's vehicle", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [{ vehicle_id: "v-other", owned_until: null, is_primary: true }],
        error: null,
      },
      digital_vehicle_inspections: {
        data: { id: "insp-1", vehicle_id: "v-not-yours" },
        error: null,
      },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/insp-1"),
    );
    await expect(
      GET({ request: req, customer, supabase, params: { id: "insp-1" } }),
    ).rejects.toThrow("Inspection not found");
  });

  it("returns empty items array when no items", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [{ vehicle_id: "v-1", owned_until: null, is_primary: true }],
        error: null,
      },
      digital_vehicle_inspections: { data: mockInspection, error: null },
      vehicles: { data: mockVehicle, error: null },
      dvi_inspection_items: { data: [], error: null },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections/insp-1"),
    );
    const response = await GET({
      request: req,
      customer,
      supabase,
      params: { id: "insp-1" },
    });
    const body = await response.json();

    expect(body.data.items).toEqual([]);
    expect(body.data.estimated_total_cost).toBe(0);
  });
});
