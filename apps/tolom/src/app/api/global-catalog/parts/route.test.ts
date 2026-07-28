import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildSupabaseMock(
    resolved: Promise<{ data: unknown; error: unknown }>,
  ) {
    const orderName = vi.fn().mockResolvedValue(resolved);
    const orderCategory = vi.fn().mockReturnValue({ order: orderName });
    const eq = vi.fn().mockReturnValue({ order: orderCategory });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    return { from };
  }

  it("returns all active global parts ordered by category then name", async () => {
    const supabase = buildSupabaseMock(
      Promise.resolve({ data: mockParts, error: null }),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts"),
    );
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe("Brake Pad Set");
    expect(body.data[1].part_number).toBe("OF-2001");
  });

  it("returns 500 on query error", async () => {
    const supabase = buildSupabaseMock(
      Promise.resolve({
        data: null,
        error: { message: "Database connection failed" },
      }),
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
