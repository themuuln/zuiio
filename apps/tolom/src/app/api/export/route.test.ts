import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mock: writeBuffer needs to be accessible from vi.mock factory ──
const { mockWriteBuffer } = vi.hoisted(() => ({
  mockWriteBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
}));

// ── Mock refs ──────────────────────────────────────────────────────────────
const mutationRateLimiterCheckMock = vi.fn();
const apiErrorMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: apiErrorMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  mutationRateLimiter: {
    check: mutationRateLimiterCheckMock,
  },
}));

// Mock exceljs (22 MB, dynamically imported only in this route)
vi.mock("exceljs", () => {
  const Workbook = function Workbook() {
    let _cellId = 0;
    const rows = new Map<number, Record<string, unknown>>();

    const ws: Record<string, unknown> = {
      properties: { tabColor: { argb: "" } },
      pageSetup: {
        orientation: "",
        fitToPage: false,
        fitToWidth: 0,
        fitToHeight: 0,
        paperSize: 0,
        margins: {},
      },
      getCell: () => {
        _cellId++;
        return {
          value: undefined,
          font: undefined,
          fill: undefined,
          alignment: undefined,
          border: undefined,
          numFmt: undefined,
        };
      },
      getRow: (r: number) => {
        if (!rows.has(r)) {
          rows.set(r, {
            height: 0,
            getCell: () => {
              _cellId++;
              return {
                value: undefined,
                font: undefined,
                fill: undefined,
                alignment: undefined,
                border: undefined,
                numFmt: undefined,
              };
            },
          });
        }
        return rows.get(r) ?? { getCell: () => ({ value: undefined }) };
      },
      mergeCells: () => {},
      getColumn: () => ({ width: 0 }),
      views: [],
      autoFilter: {},
    };

    return {
      creator: "",
      created: undefined,
      addWorksheet: () => ws,
      xlsx: {
        writeBuffer: mockWriteBuffer,
      },
    };
  };

  return { default: { Workbook } };
});

const { POST } = await import("./route");

describe("POST /api/export", () => {
  const validColumns = [
    { key: "name", label: "Name" },
    { key: "price", label: "Price", format: "currency" as const },
    { key: "qty", label: "Quantity" },
  ];
  const validData = [
    { name: "Widget A", price: 15000, qty: 10 },
    { name: "Widget B", price: 25000, qty: 5 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates Excel file with valid data", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });

    const req = new NextRequest(new URL("http://localhost/api/export"), {
      method: "POST",
      body: JSON.stringify({
        columns: validColumns,
        data: validData,
        filename: "inventory.xlsx",
      }),
    });

    const response = await POST({ request: req });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("Content-Disposition")).toContain("inventory-");
    expect(response.headers.get("Content-Disposition")).toContain(".xlsx");
    expect(mutationRateLimiterCheckMock).toHaveBeenCalledWith("unknown");
    expect(mockWriteBuffer).toHaveBeenCalled();
  });

  it("generates Excel with default filename when none provided", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });

    const req = new NextRequest(new URL("http://localhost/api/export"), {
      method: "POST",
      body: JSON.stringify({
        columns: validColumns,
        data: validData,
      }),
    });

    const response = await POST({ request: req });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("export-");
    expect(response.headers.get("Content-Disposition")).toContain(".xlsx");
  });

  it("returns error when data is empty", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "VALIDATION", message: "No data to export" },
        }),
        { status: 400 },
      ),
    );

    const req = new NextRequest(new URL("http://localhost/api/export"), {
      method: "POST",
      body: JSON.stringify({
        columns: validColumns,
        data: [],
      }),
    });

    const response = await POST({ request: req });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION");
    expect(mutationRateLimiterCheckMock).toHaveBeenCalled();
  });

  it("throws when columns are missing", async () => {
    mutationRateLimiterCheckMock.mockResolvedValue({ allowed: true });

    const req = new NextRequest(new URL("http://localhost/api/export"), {
      method: "POST",
      body: JSON.stringify({
        data: [{ test: 1 }],
      }),
    });

    await expect(POST({ request: req })).rejects.toThrow();
    expect(mutationRateLimiterCheckMock).toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    const resetAt = Date.now() + 60_000;
    mutationRateLimiterCheckMock.mockResolvedValue({
      allowed: false,
      resetAt,
    });
    apiErrorMock.mockReturnValue(
      new Response(
        JSON.stringify({
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        }),
        { status: 429, headers: { "Retry-After": "60" } },
      ),
    );

    const req = new NextRequest(new URL("http://localhost/api/export"), {
      method: "POST",
      body: JSON.stringify({
        columns: validColumns,
        data: validData,
      }),
    });

    const response = await POST({ request: req });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(mutationRateLimiterCheckMock).toHaveBeenCalled();
  });
});
