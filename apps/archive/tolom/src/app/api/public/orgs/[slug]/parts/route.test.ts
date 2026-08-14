import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reportServerErrorMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

const { GET } = await import("./route");

describe("GET /api/public/orgs/[slug]/parts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });
  it("returns org catalog for a valid slug", async () => {
    const mockClient = buildMockClient({
      org: { id: "org-1", name: "Test Org", slug: "test-org", logo_url: null },
      vehicleModelParts: [
        {
          vehicle_model_id: "vm-1",
          specific_price: null,
          vehicle_models: {
            id: "vm-1",
            make: "Toyota",
            model: "Camry",
            generation: "XV70",
            year_start: 2023,
            year_end: null,
            is_active: true,
            deleted_at: null,
            organization_id: "org-1",
          },
          part_id: "part-1",
          parts_catalog: {
            id: "part-1",
            name: "Oil Filter",
            name_mn: "Тосны шүүлтүүр",
            part_number: "OF-100",
            category: "Filters",
            default_price: 15000,
            is_active: true,
            deleted_at: null,
            image_url: null,
          },
        },
      ],
      balances: [{ part_id: "part-1", quantity_on_hand: 5 }],
    });
    createClientMock.mockReturnValue(mockClient);

    const req = new NextRequest(
      new URL("http://localhost/api/public/orgs/test-org/parts"),
    );
    const response = await GET({ request: req });
    const body = await response.json();

    expect(body.data.org.slug).toBe("test-org");
    expect(body.data.brands).toEqual([{ make: "Toyota", model_count: 1 }]);
    expect(body.data.models).toHaveLength(1);
    expect(body.data.models[0]).toMatchObject({
      make: "Toyota",
      model: "Camry",
      part_count: 1,
    });
    expect(body.data.parts).toHaveLength(1);
    expect(body.data.parts[0]).toMatchObject({
      name: "Oil Filter",
      price: 15000,
      in_stock: true,
      vehicle_model_id: "vm-1",
    });
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300",
    );
  });

  it("returns 404 when slug is missing", async () => {
    const req = new NextRequest(
      new URL("http://localhost/api/public/orgs//parts"),
    );
    const response = await GET({ request: req });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 when org not found", async () => {
    const mockClient = buildMockClient({ org: null });
    createClientMock.mockReturnValue(mockClient);

    const req = new NextRequest(
      new URL("http://localhost/api/public/orgs/nonexistent/parts"),
    );
    const response = await GET({ request: req });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 500 when env vars are missing", async () => {
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = new NextRequest(
      new URL("http://localhost/api/public/orgs/test-org/parts"),
    );
    const response = await GET({ request: req });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("CONFIG_ERROR");

    process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  });

  it("returns 500 on vehicle_model_parts query error", async () => {
    const mockClient = buildMockClient({
      org: { id: "org-1", name: "Test", slug: "test", logo_url: null },
      vehicleModelPartsError: new Error("Query failed"),
    });
    createClientMock.mockReturnValue(mockClient);

    const req = new NextRequest(
      new URL("http://localhost/api/public/orgs/test-org/parts"),
    );
    const response = await GET({ request: req });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("CATALOG_ERROR");
    expect(reportServerErrorMock).toHaveBeenCalled();
  });

  it("filters out inactive or deleted vehicle models", async () => {
    const mockClient = buildMockClient({
      org: { id: "org-1", name: "Test", slug: "test", logo_url: null },
      vehicleModelParts: [
        {
          vehicle_model_id: "vm-active",
          specific_price: null,
          vehicle_models: {
            id: "vm-active",
            make: "Honda",
            model: "Civic",
            generation: null,
            year_start: null,
            year_end: null,
            is_active: true,
            deleted_at: null,
            organization_id: "org-1",
          },
          part_id: "part-active",
          parts_catalog: {
            id: "part-active",
            name: "Brake Pad",
            name_mn: null,
            part_number: "BP-1",
            category: "Brakes",
            default_price: 25000,
            is_active: true,
            deleted_at: null,
            image_url: null,
          },
        },
        {
          vehicle_model_id: "vm-inactive",
          specific_price: null,
          vehicle_models: {
            id: "vm-inactive",
            make: "Honda",
            model: "Accord",
            generation: null,
            year_start: null,
            year_end: null,
            is_active: false,
            deleted_at: null,
            organization_id: "org-1",
          },
          part_id: "part-inactive",
          parts_catalog: {
            id: "part-inactive",
            name: "Wiper",
            name_mn: null,
            part_number: "WP-1",
            category: "Wipers",
            default_price: 5000,
            is_active: true,
            deleted_at: null,
            image_url: null,
          },
        },
        {
          vehicle_model_id: "vm-deleted",
          specific_price: null,
          vehicle_models: {
            id: "vm-deleted",
            make: "Honda",
            model: "Deleted",
            generation: null,
            year_start: null,
            year_end: null,
            is_active: true,
            deleted_at: "2024-01-01",
            organization_id: "org-1",
          },
          part_id: "part-deleted",
          parts_catalog: {
            id: "part-deleted",
            name: "Battery",
            name_mn: null,
            part_number: "BT-1",
            category: "Electrical",
            default_price: 100000,
            is_active: true,
            deleted_at: null,
            image_url: null,
          },
        },
      ],
      balances: [],
    });
    createClientMock.mockReturnValue(mockClient);

    const req = new NextRequest(
      new URL("http://localhost/api/public/orgs/test-org/parts"),
    );
    const response = await GET({ request: req });
    const body = await response.json();

    // Only 1 active part should be in the output
    expect(body.data.parts).toHaveLength(1);
    expect(body.data.parts[0].name).toBe("Brake Pad");
  });

  it("uses specific_price over default_price", async () => {
    const mockClient = buildMockClient({
      org: { id: "org-1", name: "Test", slug: "test", logo_url: null },
      vehicleModelParts: [
        {
          vehicle_model_id: "vm-1",
          specific_price: 12000,
          vehicle_models: {
            id: "vm-1",
            make: "Toyota",
            model: "Corolla",
            generation: null,
            year_start: null,
            year_end: null,
            is_active: true,
            deleted_at: null,
            organization_id: "org-1",
          },
          part_id: "part-1",
          parts_catalog: {
            id: "part-1",
            name: "Oil Filter",
            name_mn: null,
            part_number: "OF-1",
            category: "Filters",
            default_price: 15000,
            is_active: true,
            deleted_at: null,
            image_url: null,
          },
        },
      ],
      balances: [],
    });
    createClientMock.mockReturnValue(mockClient);

    const req = new NextRequest(
      new URL("http://localhost/api/public/orgs/test-org/parts"),
    );
    const response = await GET({ request: req });
    const body = await response.json();

    // specific_price (12000) overrides default_price (15000)
    expect(body.data.parts[0].price).toBe(12000);
  });
});

function buildMockClient({
  org,
  vehicleModelParts,
  vehicleModelPartsError,
  balances,
}: {
  org: Record<string, unknown> | null;
  vehicleModelParts?: Record<string, unknown>[];
  vehicleModelPartsError?: Error;
  balances?: { part_id: string; quantity_on_hand: number }[];
}) {
  const mockClient = {
    from: vi.fn((table: string) => {
      const chain: Record<string, unknown> = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        is: vi.fn(() => chain),
        in: vi.fn(() => chain),
        single: vi.fn(() => chain),
      };

      if (table === "organizations") {
        chain.single = vi.fn(() => ({
          data: org ?? null,
          error: org ? null : { message: "Not found" },
        }));
      } else if (table === "vehicle_model_parts") {
        chain.eq = vi.fn(() => ({
          data: vehicleModelParts ?? [],
          error: vehicleModelPartsError ?? null,
        }));
      } else if (table === "inventory_balances") {
        chain.eq = vi.fn(() => chain);
        chain.in = vi.fn(() => ({
          data: balances ?? [],
          error: null,
        }));
      }

      return chain;
    }),
  };
  return mockClient;
}
