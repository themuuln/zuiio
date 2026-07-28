import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({}));

vi.mock("@/lib/portal-auth", () => ({
  createPortalRouteHandler: vi.fn((handler: unknown) => handler),
}));

const _vehicleOwnersSelectMock = vi.fn();
const _workOrdersSelectMock = vi.fn();

function makeSupabase(
  ownerData: Record<string, unknown>[] | null,
  ownerError: Record<string, unknown> | null,
  woData: Record<string, unknown>[] | null,
  woError: Record<string, unknown> | null,
) {
  const ownerEqMock = vi.fn().mockReturnThis();
  const ownerIsMock = vi.fn().mockResolvedValue({
    data: ownerData,
    error: ownerError,
  });

  const woIsMock = vi.fn().mockReturnThis();
  const woInMock = vi.fn().mockReturnThis();
  const woOrderMock = vi.fn().mockResolvedValue({
    data: woData,
    error: woError,
  });

  return {
    from: vi.fn((table: string) => {
      if (table === "vehicle_owners") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: ownerEqMock,
          is: ownerIsMock,
        };
      }
      if (table === "work_orders") {
        return {
          select: vi.fn().mockReturnThis(),
          in: woInMock,
          is: woIsMock,
          order: woOrderMock,
        };
      }
      return { select: vi.fn().mockReturnThis() };
    }),
  };
}

const { GET } = await import("./route");

describe("GET /api/portal/work-orders", () => {
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

  it("returns work orders for the customer's vehicles", async () => {
    const supabase = makeSupabase(
      [{ vehicle_id: "v1" }, { vehicle_id: "v2" }],
      null,
      [
        {
          id: "wo-1",
          status: "completed",
          description: "Oil change",
          total: 50000,
          created_at: "2024-01-01",
          started_at: null,
          completed_at: "2024-01-02",
          vehicle: {
            id: "v1",
            plate_number: "ABC123",
            make: "Toyota",
            model: "Camry",
            year: 2023,
          },
        },
      ],
      null,
    );

    const req = new NextRequest(
      new URL("http://localhost/api/portal/work-orders"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("wo-1");
    expect(body.data[0].vehicle.plate_number).toBe("ABC123");
  });

  it("returns empty array when customer has no vehicles", async () => {
    const supabase = makeSupabase([], null, null, null);

    const req = new NextRequest(
      new URL("http://localhost/api/portal/work-orders"),
    );
    const response = await GET({ request: req, customer, supabase });
    const body = await response.json();

    expect(body.data).toEqual([]);
  });

  it("throws on vehicle_owners query error", async () => {
    const supabase = makeSupabase(null, { message: "DB error" }, null, null);

    const req = new NextRequest(
      new URL("http://localhost/api/portal/work-orders"),
    );
    await expect(GET({ request: req, customer, supabase })).rejects.toThrow(
      "DB error",
    );
  });

  it("throws on work_orders query error", async () => {
    const supabase = makeSupabase([{ vehicle_id: "v1" }], null, null, {
      message: "WO error",
    });

    const req = new NextRequest(
      new URL("http://localhost/api/portal/work-orders"),
    );
    await expect(GET({ request: req, customer, supabase })).rejects.toThrow(
      "WO error",
    );
  });
});
