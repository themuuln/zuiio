import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

/**
 * Creates a Supabase query builder mock that is thenable — supports
 * `await supabase.from("t").select().eq().in().order()` patterns.
 * Each method returns the builder itself; the builder has a `then()` that
 * resolves to the registered table value.
 */
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
        builder.select = vi.fn(() => builder);
        builder.eq = vi.fn(() => builder);
        builder.in = vi.fn(() => builder);
        builder.is = vi.fn(() => builder);
        builder.order = vi.fn(() => builder);
        builder.single = vi.fn(() => builder);
        builder.maybeSingle = vi.fn(() => builder);
      }
      return builder;
    }),
  };
}

describe("GET /api/portal/inspections", () => {
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

  it("returns inspections for customer vehicles", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [
          { vehicle_id: "v-1", owned_until: null, is_primary: true },
          { vehicle_id: "v-2", owned_until: null, is_primary: false },
        ],
        error: null,
      },
      digital_vehicle_inspections: {
        data: [
          {
            id: "insp-1",
            vehicle_id: "v-1",
            status: "sent",
            created_at: "2026-07-30T10:00:00Z",
            updated_at: "2026-07-30T10:30:00Z",
            odometer: 50000,
          },
          {
            id: "insp-2",
            vehicle_id: "v-2",
            status: "approved",
            created_at: "2026-07-29T10:00:00Z",
            updated_at: "2026-07-29T12:00:00Z",
            odometer: 30000,
          },
        ],
        error: null,
      },
      vehicles: {
        data: [
          {
            id: "v-1",
            plate_number: "ABC123",
            make: "Toyota",
            model: "Camry",
            year: 2020,
          },
          {
            id: "v-2",
            plate_number: "XYZ789",
            make: "Honda",
            model: "Civic",
            year: 2022,
          },
        ],
        error: null,
      },
      dvi_inspection_items: {
        data: [
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
          },
          {
            id: "item-2",
            inspection_id: "insp-1",
            category: "brakes",
            item_name: "Brake pads",
            condition: "poor",
            severity: "urgent",
            estimated_cost: 250000,
            customer_approved: true,
            has_photo: true,
          },
        ],
        error: null,
      },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe("insp-1");
    expect(body.data[0].vehicle.plate_number).toBe("ABC123");
    expect(body.data[0].item_count).toBe(2);
    expect(body.data[1].vehicle.plate_number).toBe("XYZ789");
  });

  it("returns empty array when customer has no vehicles", async () => {
    const supabase = mockDb({
      vehicle_owners: { data: [], error: null },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toEqual([]);
  });

  it("returns empty array when no inspections exist", async () => {
    const supabase = mockDb({
      vehicle_owners: {
        data: [{ vehicle_id: "v-1", owned_until: null, is_primary: true }],
        error: null,
      },
      digital_vehicle_inspections: { data: [], error: null },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toEqual([]);
  });

  it("returns empty array on vehicle_owners query error (graceful handling)", async () => {
    const supabase = mockDb({
      vehicle_owners: { data: null, error: new Error("DB error") },
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/inspections"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    // Route gracefully handles ownership error by returning empty
    expect(body.data).toEqual([]);
  });
});
