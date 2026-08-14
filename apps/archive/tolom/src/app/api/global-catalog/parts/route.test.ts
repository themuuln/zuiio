import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const searchGlobalPartsMock = vi.fn();
vi.mock("@/lib/services/global-catalog-service", () => ({
  searchGlobalParts: searchGlobalPartsMock,
}));

const { GET } = await import("./route");

describe("GET /api/global-catalog/parts", () => {
  const user = { id: "user-1" };
  const mockParts = [
    {
      id: "1",
      name: "Brake Pad Set",
      name_mn: "Тормозны дэвсгэр",
      category: "Brake System",
      description: "Front brake pads",
      part_number: "BP-1001",
      unit: "set",
      is_active: true,
    },
    {
      id: "2",
      name: "Oil Filter",
      name_mn: "Тосны шүүлтүүр",
      category: "Engine",
      description: null,
      part_number: "OF-2001",
      unit: "pcs",
      is_active: true,
    },
  ];

  const supabase = {} as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all active global parts by default", async () => {
    searchGlobalPartsMock.mockResolvedValue(mockParts);

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts"),
    );
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(searchGlobalPartsMock).toHaveBeenCalledWith(supabase, undefined, {});
    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe("Brake Pad Set");
    expect(body.data[1].part_number).toBe("OF-2001");
  });

  it("passes search query param to service", async () => {
    searchGlobalPartsMock.mockResolvedValue([mockParts[0]]);

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts?q=brake"),
    );
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(searchGlobalPartsMock).toHaveBeenCalledWith(supabase, "brake", {});
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Brake Pad Set");
  });

  it("passes category filter", async () => {
    searchGlobalPartsMock.mockResolvedValue([mockParts[0]]);

    const req = new NextRequest(
      new URL(
        "http://localhost/api/global-catalog/parts?category=Brake%20System",
      ),
    );
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(searchGlobalPartsMock).toHaveBeenCalledWith(supabase, undefined, {
      category: "Brake System",
    });
    expect(body.data).toHaveLength(1);
  });

  it("passes pagination params", async () => {
    searchGlobalPartsMock.mockResolvedValue([mockParts[1]]);

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts?limit=10&offset=20"),
    );
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(searchGlobalPartsMock).toHaveBeenCalledWith(supabase, undefined, {
      limit: 10,
      offset: 20,
    });
    expect(body.data).toHaveLength(1);
  });

  it("returns 500 on query error", async () => {
    searchGlobalPartsMock.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts"),
    );
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("QUERY_ERROR");
    expect(body.error.message).toBe("Database connection failed");
  });
});
