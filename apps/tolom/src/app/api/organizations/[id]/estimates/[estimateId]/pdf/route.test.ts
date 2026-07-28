import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getEstimateMock = vi.fn();
const renderToPdfBufferMock = vi.fn();
const pdfFilenameMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/estimate-service", () => ({
  getEstimate: getEstimateMock,
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

describe("organizations/[id]/estimates/[estimateId]/pdf route", () => {
  const orgId = "org-1";
  const estimateId = "est-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns PDF on success", async () => {
      const estimate = {
        id: estimateId,
        estimate_number: "EST-001",
        discount_amount: 0,
        discount_percentage: 0,
        discount_total: 0,
        tax_total: 100,
        grand_total: 1100,
        subtotal: 1000,
        items: [
          {
            unit_price: 500,
            discount_amount: 0,
            discount_percentage: 0,
            line_total: 500,
          },
        ],
      };
      getEstimateMock.mockResolvedValue(estimate);

      const orgRow = {
        data: {
          name: "Test Garage",
          phone: "555-0100",
          email: "test@test.com",
          address: "123 Main",
        },
      };
      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(orgRow),
      };

      const pdfBuffer = Buffer.from("%PDF-1.4 mock pdf content");
      renderToPdfBufferMock.mockResolvedValue(pdfBuffer);
      pdfFilenameMock.mockReturnValue("EST-001.pdf");

      const response = await (GET as any)({
        params: { estimateId },
        supabase,
        orgId,
      });

      expect(getEstimateMock).toHaveBeenCalledWith(supabase, estimateId, orgId);
      expect(renderToPdfBufferMock).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
      expect(response.headers.get("Content-Disposition")).toContain(
        "EST-001.pdf",
      );
    });

    it("returns 404 when estimate not found", async () => {
      getEstimateMock.mockResolvedValue(null);

      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      const response = await (GET as any)({
        params: { estimateId },
        supabase,
        orgId,
      });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("handles service error", async () => {
      getEstimateMock.mockRejectedValue(new Error("DB error"));

      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      await expect(
        (GET as any)({ params: { estimateId }, supabase, orgId }),
      ).rejects.toThrow("DB error");
    });
  });
});
