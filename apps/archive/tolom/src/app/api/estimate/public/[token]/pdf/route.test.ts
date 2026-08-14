import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const renderToPdfBufferMock = vi.fn();
const pdfFilenameMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/pdf/estimate-document", () => ({
  EstimateDocument: vi.fn(() => "estimate-doc"),
}));

vi.mock("@/lib/utils/pdf", () => ({
  renderToPdfBuffer: renderToPdfBufferMock,
  pdfFilename: pdfFilenameMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("GET /api/estimate/public/[token]/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns PDF on success", async () => {
    const estimateData = {
      estimate_number: "EST-001",
      status: "approved",
      created_at: "2026-07-20T10:00:00Z",
      valid_until: "2026-08-20T10:00:00Z",
      notes: "Thank you for your business",
      terms: "Payment due upon receipt",
      subtotal: 1000,
      discount_amount: 50,
      discount_percentage: 5,
      discount_total: 50,
      tax_total: 100,
      grand_total: 1050,
      customer: {
        first_name: "John",
        last_name: "Doe",
        phone: "555-0100",
        email: "john@example.com",
      },
      vehicle: {
        plate_number: "ABC-123",
        make: "Toyota",
        model: "Camry",
        year: 2020,
      },
      items: [
        {
          description: "Oil change",
          item_type: "service",
          quantity: 1,
          unit_price: 500,
          discount_amount: 0,
          discount_percentage: 0,
          line_total: 500,
        },
      ],
      organization: {
        name: "Test Garage",
        phone: "555-0200",
        email: "garage@test.com",
        address: "456 Oak St",
      },
    };

    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: estimateData, error: null }),
    };

    const pdfBuffer = Buffer.from("%PDF-1.4 mock pdf content");
    renderToPdfBufferMock.mockResolvedValue(pdfBuffer);
    pdfFilenameMock.mockReturnValue("EST-001.pdf");

    const response = await (GET as any)({
      params: { token: "public-token-123" },
      supabase,
    });

    expect(supabase.rpc).toHaveBeenCalledWith("get_public_estimate_by_token", {
      p_token: "public-token-123",
    });
    expect(renderToPdfBufferMock).toHaveBeenCalled();
    expect(pdfFilenameMock).toHaveBeenCalledWith("EST-001");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      "EST-001.pdf",
    );
  });

  it("returns 404 when estimate not found", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const response = await (GET as any)({
      params: { token: "invalid-token" },
      supabase,
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(renderToPdfBufferMock).not.toHaveBeenCalled();
  });

  it("returns 404 when RPC returns error", async () => {
    const supabase = {
      rpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Invalid token" } }),
    };

    const response = await (GET as any)({
      params: { token: "bad-token" },
      supabase,
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(renderToPdfBufferMock).not.toHaveBeenCalled();
  });
});
