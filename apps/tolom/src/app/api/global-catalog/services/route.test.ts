import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const searchGlobalServicesMock = vi.fn();
vi.mock("@/lib/services/global-catalog-service", () => ({
  searchGlobalServices: searchGlobalServicesMock,
}));

const { GET } = await import("./route");

describe("GET /api/global-catalog/services", () => {
  const supabase = {} as unknown as SupabaseClient;
  const user = { id: "user-1" };
  const mockServices = [
    {
      id: "gs-1",
      name: "Oil Change",
      name_mn: "Тос солих",
      category: "Maintenance",
      description: "Engine oil replacement",
      estimated_duration_minutes: 30,
      interval_months: 6,
      interval_km: 10000,
      is_active: true,
    },
    {
      id: "gs-2",
      name: "Brake Inspection",
      name_mn: "Тормозны үзлэг",
      category: "Brake System",
      description: null,
      estimated_duration_minutes: 20,
      interval_months: 12,
      interval_km: 20000,
      is_active: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all active services by default", async () => {
    searchGlobalServicesMock.mockResolvedValue(mockServices);

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/services"),
    );
    const response = await (GET as any)({ request: req, supabase, user });
    const body = await response.json();

    expect(searchGlobalServicesMock).toHaveBeenCalledWith(
      supabase,
      undefined,
      {},
    );
    expect(body.data).toEqual(mockServices);
  });

  it("passes search query", async () => {
    searchGlobalServicesMock.mockResolvedValue([mockServices[0]]);

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/services?q=Oil"),
    );
    const response = await (GET as any)({ request: req, supabase, user });
    const body = await response.json();

    expect(searchGlobalServicesMock).toHaveBeenCalledWith(supabase, "Oil", {});
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Oil Change");
  });

  it("passes category filter", async () => {
    searchGlobalServicesMock.mockResolvedValue([mockServices[0]]);

    const req = new NextRequest(
      new URL(
        "http://localhost/api/global-catalog/services?category=Maintenance",
      ),
    );
    const response = await (GET as any)({ request: req, supabase, user });
    const body = await response.json();

    expect(searchGlobalServicesMock).toHaveBeenCalledWith(supabase, undefined, {
      category: "Maintenance",
    });
    expect(body.data).toHaveLength(1);
  });

  it("returns 500 on query error", async () => {
    searchGlobalServicesMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/services"),
    );
    const response = await (GET as any)({ request: req, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("QUERY_ERROR");
    expect(body.error.message).toBe("DB error");
  });
});
