import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getInvoiceMock = vi.fn();
const getOrganizationMock = vi.fn();
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

vi.mock("@/lib/services/invoice-service", () => ({
  getInvoice: getInvoiceMock,
}));

vi.mock("@/lib/services/organization-service", () => ({
  getOrganization: getOrganizationMock,
}));

vi.mock("@/lib/pdf/invoice-document", () => ({
  InvoiceDocument: vi.fn(() => "invoice-doc"),
}));

vi.mock("@/lib/utils/pdf", () => ({
  renderToPdfBuffer: renderToPdfBufferMock,
  pdfFilename: pdfFilenameMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/invoices/[invoiceId]/pdf route", () => {
  const orgId = "org-1";
  const invoiceId = "inv-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns PDF on success", async () => {
      const invoice = {
        id: invoiceId,
        invoice_number: "INV-001",
        items: [],
        payments: [],
      };
      getInvoiceMock.mockResolvedValue(invoice);
      getOrganizationMock.mockResolvedValue({
        name: "Test Garage",
        logo_url: null,
      });

      const supabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            name: "Main",
            address: "123 Main",
            phone: "555-0100",
            email: "test@test.com",
          },
        }),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { default_currency: "MNT", default_tax_rate: 10 },
        }),
      };

      const pdfBuffer = Buffer.from("%PDF-1.4 mock pdf content");
      renderToPdfBufferMock.mockResolvedValue(pdfBuffer);
      pdfFilenameMock.mockReturnValue("invoice-INV-001.pdf");

      const response = await (GET as any)({
        params: { id: orgId, invoiceId },
        supabase,
      });

      expect(getInvoiceMock).toHaveBeenCalledWith(supabase, invoiceId);
      expect(getOrganizationMock).toHaveBeenCalledWith(supabase, orgId);
      expect(renderToPdfBufferMock).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
      expect(response.headers.get("Content-Disposition")).toContain(
        "invoice-INV-001.pdf",
      );
    });

    it("handles service error", async () => {
      getInvoiceMock.mockRejectedValue(new Error("DB error"));

      const supabase = { from: vi.fn() };

      await expect(
        (GET as any)({ params: { id: orgId, invoiceId }, supabase }),
      ).rejects.toThrow("DB error");
    });
  });
});
