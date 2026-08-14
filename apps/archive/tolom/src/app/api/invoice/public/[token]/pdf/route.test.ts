import type { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const renderToPdfBufferMock = vi.fn();
const pdfFilenameMock = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), { status }),
  ),
}));

vi.mock("@/lib/pdf/invoice-document", () => ({
  InvoiceDocument: vi.fn(() => "invoice-doc"),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock("@/lib/utils/pdf", () => ({
  renderToPdfBuffer: renderToPdfBufferMock,
  pdfFilename: pdfFilenameMock,
}));

// Dynamic imports after vi.mock are the standard Vitest route-test pattern (module-loading boundary).
const { GET } = await import("./route");
const { createServiceRoleClient } = await import("@/lib/supabase/service-role");

// ── Helpers ──────────────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null) {
  const result = Promise.resolve({ data, error });
  return {
    select: vi.fn(() => mockChain(data, error)),
    eq: vi.fn(() => mockChain(data, error)),
    order: vi.fn(() => mockChain(data, error)),
    single: vi.fn(() => result),
    maybeSingle: vi.fn(() => result),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
    finally: result.finally.bind(result),
  };
}

// Thor's hammer for calling route handlers in tests — the handler type is
// incompatible with plain mock call args, so we cast through unknown.
const callHandler = GET as unknown as (opts: {
  params: Record<string, string>;
}) => Promise<NextResponse>;

// ── Tests ──────────────────────────────────────────────────────

describe("GET /api/invoice/public/[token]/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns PDF on success", async () => {
    const invoiceData = {
      id: "inv-1",
      organization_id: "org-1",
      invoice_number: "INV-001",
      status: "paid",
      currency: "MNT",
      subtotal: 100,
      total: 110,
    };

    const itemsData = [
      {
        id: "item-1",
        invoice_id: "inv-1",
        item_type: "service",
        description: "Oil Change",
        quantity: 1,
        unit_price: 100,
        discount_amount: 0,
        total_price: 100,
        sort_order: 1,
      },
    ];

    const paymentsData = [
      {
        id: "pay-1",
        invoice_id: "inv-1",
        amount: 110,
        method: "cash",
        reference: null,
        notes: null,
        paid_at: "2026-07-27T00:00:00Z",
      },
    ];

    const orgData = { name: "Test Garage", logo_url: null };
    const branchData = {
      name: "Main Branch",
      address: "123 Main St",
      phone: "555-0100",
      email: "branch@test.com",
    };
    const settingsData = { default_currency: "MNT", default_tax_rate: 10 };

    // Set up chain mocks per table
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "invoice_items":
          return mockChain(itemsData);
        case "invoice_payments":
          return mockChain(paymentsData);
        case "organizations":
          return mockChain(orgData);
        case "branches":
          return mockChain(branchData);
        case "organization_settings":
          return mockChain(settingsData);
        default:
          return mockChain(null, null);
      }
    });

    mockRpc.mockResolvedValue({ data: invoiceData, error: null });

    const supabase = { rpc: mockRpc, from: mockFrom };
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase);

    const pdfBuffer = Buffer.from("%PDF-1.4 mock pdf content");
    renderToPdfBufferMock.mockResolvedValue(pdfBuffer);
    pdfFilenameMock.mockReturnValue("INV-001.pdf");

    const response = await callHandler({
      params: { token: "public-token-123" },
    });

    expect(mockRpc).toHaveBeenCalledWith("get_public_invoice_by_token", {
      p_token: "public-token-123",
    });
    expect(mockFrom).toHaveBeenCalledWith("invoice_items");
    expect(mockFrom).toHaveBeenCalledWith("invoice_payments");
    expect(mockFrom).toHaveBeenCalledWith("organizations");
    expect(mockFrom).toHaveBeenCalledWith("branches");
    expect(mockFrom).toHaveBeenCalledWith("organization_settings");
    expect(renderToPdfBufferMock).toHaveBeenCalled();
    expect(pdfFilenameMock).toHaveBeenCalledWith("invoice-INV-001");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      "INV-001.pdf",
    );
  });

  it("returns 404 when invoice not found (null data)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const supabase = { rpc: mockRpc, from: mockFrom };
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase);

    const response = await callHandler({
      params: { token: "invalid-token" },
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(renderToPdfBufferMock).not.toHaveBeenCalled();
  });

  it("returns 404 when RPC returns error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Invalid token" },
    });

    const supabase = { rpc: mockRpc, from: mockFrom };
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase);

    const response = await callHandler({
      params: { token: "bad-token" },
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(renderToPdfBufferMock).not.toHaveBeenCalled();
  });
});
