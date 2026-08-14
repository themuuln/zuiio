import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

describe("GET /api/portal/vehicles", () => {
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

  it("returns vehicles for the customer", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "vehicle_owners") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({
              data: [{ vehicle_id: "v1" }, { vehicle_id: "v2" }],
              error: null,
            }),
          };
        }
        if (table === "vehicles") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                {
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
                  last_visit_at: "2024-06-01",
                  next_service_at: "2024-12-01",
                  created_at: "2023-01-01",
                },
              ],
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };

    const req = new NextRequest(
      new URL("http://localhost/api/portal/vehicles"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].plate_number).toBe("ABC123");
    expect(body.data[0].make).toBe("Toyota");
  });

  it("returns empty array when customer has no vehicles", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "vehicle_owners") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };

    const req = new NextRequest(
      new URL("http://localhost/api/portal/vehicles"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toEqual([]);
  });

  it("throws on vehicle_owners query error", async () => {
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Ownership error" },
      }),
    };

    const req = new NextRequest(
      new URL("http://localhost/api/portal/vehicles"),
    );
    await expect(GET({ request: req, customer, supabase })).rejects.toThrow(
      "Ownership error",
    );
  });

  it("throws on vehicles query error", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "vehicle_owners") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({
              data: [{ vehicle_id: "v1" }],
              error: null,
            }),
          };
        }
        if (table === "vehicles") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Vehicles error" },
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };

    const req = new NextRequest(
      new URL("http://localhost/api/portal/vehicles"),
    );
    await expect(GET({ request: req, customer, supabase })).rejects.toThrow(
      "Vehicles error",
    );
  });
});
