import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getServicesMock = vi.fn();
const getPartsCatalogMock = vi.fn();
const getInventoryBalancesMock = vi.fn();
const getStockThresholdsMock = vi.fn();
const getMechanicsListMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getInventoryBalances: getInventoryBalancesMock,
  getPartsCatalog: getPartsCatalogMock,
  getStockThresholds: getStockThresholdsMock,
}));

vi.mock("@/lib/services/report-service/mechanics", () => ({
  getMechanicsList: getMechanicsListMock,
}));

vi.mock("@/lib/services/service-catalog-service", () => ({
  getServices: getServicesMock,
}));

const { GET } = await import("./route");

interface HandlerContext {
  supabase: SupabaseClient;
  orgId: string;
}

function buildCatalogsSupabase(overrides: {
  globalServices?: { data: unknown[] | null; error: unknown };
  globalParts?: { data: unknown[] | null; error: unknown };
  servicePrices?: { data: unknown[] | null; error: unknown };
  partPrices?: { data: unknown[] | null; error: unknown };
  orgSettings?: {
    data: { settings: Record<string, unknown> } | null;
    error: unknown;
  };
}): SupabaseClient {
  const opts = {
    globalServices: { data: [], error: null },
    globalParts: { data: [], error: null },
    servicePrices: { data: [], error: null },
    partPrices: { data: [], error: null },
    orgSettings: { data: { settings: {} }, error: null },
    ...overrides,
  };

  const resolve = (result: { data: unknown; error: unknown }) =>
    vi.fn().mockResolvedValue(result);

  return {
    from: vi.fn((table: string) => {
      switch (table) {
        case "global_services_catalog":
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ order: resolve(opts.globalServices) })),
              })),
            })),
          };
        case "global_parts_catalog":
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ order: resolve(opts.globalParts) })),
              })),
            })),
          };
        case "service_price_history":
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ limit: resolve(opts.servicePrices) })),
              })),
            })),
          };
        case "part_price_history":
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ limit: resolve(opts.partPrices) })),
              })),
            })),
          };
        case "organizations":
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ single: resolve(opts.orgSettings) })),
            })),
          };
        default:
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  order: vi.fn(() => ({
                    order: resolve({ data: [], error: null }),
                  })),
                })),
              })),
            })),
          };
      }
    }),
  } as unknown as SupabaseClient;
}

describe("organizations/[id]/catalogs route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns aggregated catalog data", async () => {
    const services = [{ id: "svc-1", name: "Oil Change" }];
    const parts = [{ id: "prt-1", name: "Oil Filter" }];
    const balances = [{ part_id: "prt-1", quantity: 10 }];
    const thresholds = [{ part_id: "prt-1", min: 5 }];
    const mechanics = [{ id: "m-1", name: "Bob" }];

    getServicesMock.mockResolvedValue(services);
    getPartsCatalogMock.mockResolvedValue(parts);
    getInventoryBalancesMock.mockResolvedValue(balances);
    getStockThresholdsMock.mockResolvedValue(thresholds);
    getMechanicsListMock.mockResolvedValue(mechanics);

    const supabase = buildCatalogsSupabase({
      globalServices: {
        data: [{ id: "gs-1", name: "Brake Pad" }],
        error: null,
      },
      globalParts: { data: [{ id: "gp-1", name: "Spark Plug" }], error: null },
    });

    const context: HandlerContext = { supabase, orgId };
    const response = await GET(context);
    const body = await response.json();

    expect(body.data.servicesCatalog).toEqual(services);
    expect(body.data.partsCatalog).toEqual(parts);
    expect(body.data.globalServices).toEqual([
      { id: "gs-1", name: "Brake Pad" },
    ]);
    expect(body.data.globalParts).toEqual([{ id: "gp-1", name: "Spark Plug" }]);
    expect(body.data.balances).toEqual(balances);
    expect(body.data.thresholds).toEqual(thresholds);
    expect(body.data.mechanics).toEqual(mechanics);
  });

  it("handles service error", async () => {
    getServicesMock.mockRejectedValue(new Error("Catalog error"));

    const supabase = buildCatalogsSupabase({});
    const context: HandlerContext = { supabase, orgId };
    await expect(GET(context)).rejects.toThrow("Catalog error");
  });
});
