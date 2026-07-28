import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

const { GET } = await import("./route");

describe("GET /api/global-catalog/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active services ordered by category and name", async () => {
    const services = [
      {
        id: "srv-1",
        name: "Oil Change",
        name_mn: "Тос солих",
        category: "Maintenance",
        description: "Replace engine oil and filter",
        estimated_duration_minutes: 30,
        interval_months: 6,
        interval_km: 5000,
        is_active: true,
      },
      {
        id: "srv-2",
        name: "Tire Rotation",
        name_mn: "Дугуй солих",
        category: "Tires",
        description: null,
        estimated_duration_minutes: 20,
        interval_months: null,
        interval_km: 10000,
        is_active: true,
      },
    ];

    // Two .order() calls: first is chainable, second resolves
    const resolveOrder = vi
      .fn()
      .mockResolvedValue({ data: services, error: null });

    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi
        .fn()
        .mockReturnThis() // first order("category") → chainable
        .mockReturnValueOnce({ order: resolveOrder }), // second order("name") → resolved promise
    };

    const request = new NextRequest(
      new URL("http://localhost/api/global-catalog/services"),
    );
    const response = await (GET as any)({ request, supabase });
    const body = await response.json();

    expect(supabase.from).toHaveBeenCalledWith("global_services_catalog");
    expect(supabase.select).toHaveBeenCalledWith(
      "id, name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km, is_active",
    );
    expect(supabase.order).toHaveBeenCalledTimes(1);
    expect(supabase.order).toHaveBeenCalledWith("category");
    expect(resolveOrder).toHaveBeenCalledWith("name");
    expect(body.data).toEqual(services);
    expect(response.status).toBe(200);
  });

  it("returns 500 on query error", async () => {
    const resolveOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi
        .fn()
        .mockReturnThis()
        .mockReturnValueOnce({ order: resolveOrder }),
    };

    const request = new NextRequest(
      new URL("http://localhost/api/global-catalog/services"),
    );
    const response = await (GET as any)({ request, supabase });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("QUERY_ERROR");
    expect(body.error.message).toBe("Database connection failed");
  });
});
