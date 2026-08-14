/**
 * Tests for src/lib/export/serve-export.ts
 */
import { describe, expect, it, vi } from "vitest";
import type { ServeExportConfig } from "../serve-export";

// ---------------------------------------------------------------------------
// Mock queries — chainable builder for supabase `.from().select()`
// ---------------------------------------------------------------------------
const mockQuery = {
  eq: vi.fn(),
  is: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};

const mockSupabase = {
  from: vi.fn(),
};

const mockRequireAppContext = vi.fn();
const mockServeEntityExport = vi.fn();
const mockCapture = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/erp", () => ({
  requireAppContext: mockRequireAppContext,
}));
vi.mock("@zuiio/export", () => ({
  serveEntityExport: mockServeEntityExport,
}));
vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

// ---------------------------------------------------------------------------
// Tests
//
// Uses dynamic import for the module under test because vi.mock factories
// must be registered before the module is first loaded.  Static imports
// would resolve before the factory runs, and the mock transform would not
// apply.
// ---------------------------------------------------------------------------

describe("serveExportRoute", () => {
  const baseConfig: ServeExportConfig = {
    table: "products",
    select: "id,name,price",
    mapRow: (row: Record<string, unknown>) => ({ ...row, extra: true }),
    columns: [{ key: "name", header: "Name" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAppContext.mockResolvedValue({
      supabase: mockSupabase,
      organizationId: "org-1",
    });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(mockQuery),
    });
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.is.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.limit.mockResolvedValue({ data: [], error: null });
    mockServeEntityExport.mockReturnValue(new Response("ok", { status: 200 }));
  });

  // -----------------------------------------------------------------------
  // requireAppContext failure
  // -----------------------------------------------------------------------
  it("rejects when requireAppContext fails", async () => {
    mockRequireAppContext.mockRejectedValue(new Error("Auth failed"));

    const { serveExportRoute } = await import("../serve-export");
    await expect(
      serveExportRoute(new Request("http://localhost"), baseConfig),
    ).rejects.toThrow("Auth failed");
  });

  // -----------------------------------------------------------------------
  // Format validation
  // -----------------------------------------------------------------------
  it("returns 400 for invalid format", async () => {
    const { serveExportRoute } = await import("../serve-export");
    const res = await serveExportRoute(
      new Request("http://localhost/?format=pdf"),
      baseConfig,
    );

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Unsupported export format");
    expect(mockServeEntityExport).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Happy path — delegates to serveEntityExport
  // -----------------------------------------------------------------------
  it("delegates to serveEntityExport with mapped rows", async () => {
    const mockData = [
      { id: 1, name: "Widget", price: 10 },
      { id: 2, name: "Gadget", price: 25 },
    ];
    mockQuery.limit.mockResolvedValue({ data: mockData, error: null });
    mockServeEntityExport.mockReturnValue(
      new Response("exported", { status: 200 }),
    );

    const { serveExportRoute } = await import("../serve-export");
    const res = await serveExportRoute(
      new Request("http://localhost"),
      baseConfig,
    );

    expect(res.status).toBe(200);
    expect(mockServeEntityExport).toHaveBeenCalledOnce();

    const [rows, columns, format, filename] =
      mockServeEntityExport.mock.calls[0];
    expect(rows).toEqual([
      { id: 1, name: "Widget", price: 10, extra: true },
      { id: 2, name: "Gadget", price: 25, extra: true },
    ]);
    expect(columns).toBe(baseConfig.columns);
    // Default format when no ?format= param
    expect(format).toBe("csv");
    // Default filename when config.filename is omitted
    expect(filename).toContain("products-export-");
    // Fourth arg should be title (undefined here)
    expect(mockServeEntityExport.mock.calls[0][4]).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Eq filter
  // -----------------------------------------------------------------------
  it("applies eq filter to the supabase query", async () => {
    const config: ServeExportConfig = {
      ...baseConfig,
      eq: { status: "active", category_id: "cat-1" },
    };

    const { serveExportRoute } = await import("../serve-export");
    await serveExportRoute(new Request("http://localhost"), config);

    expect(mockQuery.eq).toHaveBeenCalledTimes(2);
    expect(mockQuery.eq).toHaveBeenCalledWith("status", "active");
    expect(mockQuery.eq).toHaveBeenCalledWith("category_id", "cat-1");
  });

  // -----------------------------------------------------------------------
  // IsNull filter
  // -----------------------------------------------------------------------
  it("applies isNull filter to the supabase query", async () => {
    const config: ServeExportConfig = {
      ...baseConfig,
      isNull: ["deleted_at", "archived_at"],
    };

    const { serveExportRoute } = await import("../serve-export");
    await serveExportRoute(new Request("http://localhost"), config);

    expect(mockQuery.is).toHaveBeenCalledTimes(2);
    expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
    expect(mockQuery.is).toHaveBeenCalledWith("archived_at", null);
  });

  // -----------------------------------------------------------------------
  // Order clause
  // -----------------------------------------------------------------------
  it("applies order clause", async () => {
    const config: ServeExportConfig = {
      ...baseConfig,
      order: { column: "name", ascending: true },
    };

    const { serveExportRoute } = await import("../serve-export");
    await serveExportRoute(new Request("http://localhost"), config);

    expect(mockQuery.order).toHaveBeenCalledOnce();
    expect(mockQuery.order).toHaveBeenCalledWith("name", {
      ascending: true,
    });
  });

  // -----------------------------------------------------------------------
  // Default limit
  // -----------------------------------------------------------------------
  it("uses default limit of 10_000", async () => {
    const { serveExportRoute } = await import("../serve-export");
    await serveExportRoute(new Request("http://localhost"), baseConfig);

    expect(mockQuery.limit).toHaveBeenCalledWith(10_000);
  });

  // -----------------------------------------------------------------------
  // Error handling — query error
  // -----------------------------------------------------------------------
  it("catches query error and returns 500", async () => {
    mockQuery.limit.mockResolvedValue({
      data: null,
      error: new Error("DB down"),
    });

    const { serveExportRoute } = await import("../serve-export");
    const res = await serveExportRoute(
      new Request("http://localhost"),
      baseConfig,
    );

    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Export failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "export/products",
    });
    expect(mockServeEntityExport).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Error handling — runtime exception inside try block
  // -----------------------------------------------------------------------
  it("catches runtime exception and returns 500", async () => {
    // Trigger a runtime error — mapRow throws
    const badConfig: ServeExportConfig = {
      ...baseConfig,
      mapRow: () => {
        throw new Error("map failure");
      },
    };
    mockQuery.limit.mockResolvedValue({
      data: [{ id: 1 }],
      error: null,
    });

    const { serveExportRoute } = await import("../serve-export");
    const res = await serveExportRoute(
      new Request("http://localhost"),
      badConfig,
    );

    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Export failed");
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error), {
      context: "export/products",
    });
    expect(mockServeEntityExport).not.toHaveBeenCalled();
  });
});
